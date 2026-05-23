require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { Issuer, generators } = require("openid-client");
const { randomUUID } = require("crypto");
const Stripe = require("stripe");

const {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { dynamo } = require("./dynamo");

const app = express();

const PORT = process.env.PORT || 3001;
const APP_URL =
  process.env.APP_URL ||
  process.env.APP_BASE_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-production";
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "CamelioData";

const COGNITO_ISSUER = process.env.COGNITO_ISSUER;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || undefined;
const COGNITO_REDIRECT_URI =
  process.env.COGNITO_REDIRECT_URI || `http://localhost:${PORT}/callback`;
const COGNITO_LOGOUT_URI = process.env.COGNITO_LOGOUT_URI || APP_URL;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;

const AWS_REGION = process.env.AWS_REGION || "us-east-2";
const S3_REGION = process.env.S3_REGION || "ca-central-1";
const S3_DOCUMENTS_BUCKET = process.env.S3_DOCUMENTS_BUCKET;

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_LOOKUP_KEY =
  process.env.STRIPE_PRICE_LOOKUP_KEY || "camelio_monthly_595";
const STRIPE_STORAGE_GB = process.env.STRIPE_STORAGE_GB || "5";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const s3 = new S3Client({
  region: S3_REGION,
});

let oidcClientPromise = null;

app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  "https://camelio-frontend.onrender.com",
  "https://camelio.app",
  "https://www.camelio.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.set("trust proxy", 1);

app.use(
  session({
    name: "camelio.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const checkAuth = (req, res, next) => {
  req.isAuthenticated = Boolean(req.session.user);
  next();
};

app.use(checkAuth);

function validateAwsConfig(req, res, next) {
  const missing = [];

  if (!process.env.AWS_REGION) missing.push("AWS_REGION");
  if (!process.env.DYNAMODB_TABLE) missing.push("DYNAMODB_TABLE");

  if (!process.env.AWS_ACCESS_KEY_ID && process.env.NODE_ENV !== "production") {
    missing.push("AWS_ACCESS_KEY_ID");
  }

  if (
    !process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.NODE_ENV !== "production"
  ) {
    missing.push("AWS_SECRET_ACCESS_KEY");
  }

  if (missing.length > 0) {
    return res.status(500).json({
      error: "aws_config_missing",
      message: "Configuration AWS incomplète.",
      missing,
    });
  }

  return next();
}

function validateS3Config(req, res, next) {
  const missing = [];

  if (!process.env.S3_REGION) missing.push("S3_REGION");

  if (!process.env.AWS_ACCESS_KEY_ID && process.env.NODE_ENV !== "production") {
    missing.push("AWS_ACCESS_KEY_ID");
  }

  if (
    !process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.NODE_ENV !== "production"
  ) {
    missing.push("AWS_SECRET_ACCESS_KEY");
  }

  if (!process.env.S3_DOCUMENTS_BUCKET) {
    missing.push("S3_DOCUMENTS_BUCKET");
  }

  if (missing.length > 0) {
    return res.status(500).json({
      error: "s3_config_missing",
      message: "Configuration S3 incomplète.",
      missing,
    });
  }

  return next();
}

function validateStripeConfig(req, res, next) {
  const missing = [];

  if (!process.env.STRIPE_SECRET_KEY) {
    missing.push("STRIPE_SECRET_KEY");
  }

  if (missing.length > 0 || !stripe) {
    return res.status(500).json({
      error: "stripe_config_missing",
      message: "Configuration Stripe incomplète.",
      missing,
    });
  }

  return next();
}

async function getClient() {
  if (!COGNITO_ISSUER || !COGNITO_CLIENT_ID) {
    throw new Error("Variables manquantes: COGNITO_ISSUER et COGNITO_CLIENT_ID.");
  }

  if (!oidcClientPromise) {
    oidcClientPromise = Issuer.discover(COGNITO_ISSUER).then((issuer) => {
      return new issuer.Client({
        client_id: COGNITO_CLIENT_ID,
        client_secret: COGNITO_CLIENT_SECRET,
        redirect_uris: [COGNITO_REDIRECT_URI],
        response_types: ["code"],
      });
    });
  }

  return oidcClientPromise;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      authenticated: false,
      message: "Utilisateur non connecté.",
    });
  }

  return next();
}

function getUserPk(req) {
  return `USER#${req.session.user.sub}`;
}

function getDemoUserPk(req) {
  return req.session.user?.sub ? getUserPk(req) : "USER#demo-user";
}

function getOwnerId(req) {
  return req.session.user?.sub || "demo-user";
}

function getReferralCode(req) {
  if (!req.session.referralCode) {
    const randomPart = generators
      .random(8)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();

    req.session.referralCode = `CAMELIO-${randomPart}`;
  }

  return req.session.referralCode;
}

function cleanChildPayload(body = {}) {
  return {
    firstName: body.firstName || "",
    lastName: body.lastName || "",
    birthDate: body.birthDate || "",
    gender: body.gender || "",
    color: body.color || "#8B5CF6",
    avatar: body.avatar || "",
    notes: body.notes || "",
  };
}

function cleanProfilePayload(body = {}) {
  return {
    displayName: body.displayName || "",
    phone: body.phone || "",
    preferredLanguage: body.preferredLanguage || "fr",
  };
}

function cleanEventPayload(body = {}) {
  return {
    title: body.title || "",
    eventType: body.eventType || body.type || "Garde",
    childIds: Array.isArray(body.childIds) ? body.childIds : [],
    childNames: Array.isArray(body.childNames) ? body.childNames : [],
    date: body.date || "",
    start: body.start || "",
    end: body.end || "",
    note: body.note || "",
    color: body.color || "sage",
  };
}

function cleanDocumentPayload(body = {}) {
  return {
    fileName: body.fileName || "",
    fileType: body.fileType || "",
    fileSize: body.fileSize || null,
    childId: body.childId || "",
    childName: body.childName || "",
    category: body.category || "Général",
  };
}

function sanitizeFileName(fileName = "") {
  return String(fileName)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

app.get("/", (req, res) => {
  res.render("index", {
    title: "Camelio Server",
    authenticated: Boolean(req.session.user),
    user: req.session.user,
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "camelio-server",
    authenticated: Boolean(req.session.user),
  });
});

app.get("/aws-check", (req, res) => {
  res.json({
    awsRegion: process.env.AWS_REGION || null,
    dynamodbTable: process.env.DYNAMODB_TABLE || null,
    s3Bucket: process.env.S3_DOCUMENTS_BUCKET || null,
    hasAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
    hasSecretKey: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
    nodeEnv: process.env.NODE_ENV || "development",
  });
});

app.get("/login", async (req, res, next) => {
  try {
    const client = await getClient();

    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    req.session.nonce = nonce;

    const authorizationUrl = client.authorizationUrl({
      scope: "openid email",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      lang: "fr",
    });

    req.session.save((err) => {
      if (err) return next(err);
      return res.redirect(authorizationUrl);
    });
  } catch (error) {
    next(error);
  }
});

app.get("/signup", async (req, res, next) => {
  try {
    if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID || !COGNITO_REDIRECT_URI) {
      return res.status(500).json({
        error: "cognito_signup_config_missing",
        message:
          "Configuration Cognito incomplète pour l'inscription. Vérifie COGNITO_DOMAIN, COGNITO_CLIENT_ID et COGNITO_REDIRECT_URI.",
      });
    }

    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    req.session.nonce = nonce;

    const signupUrl = new URL(`${COGNITO_DOMAIN.replace(/\/$/, "")}/signup`);

    signupUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
    signupUrl.searchParams.set("code_challenge", codeChallenge);
    signupUrl.searchParams.set("code_challenge_method", "S256");
    signupUrl.searchParams.set("lang", "fr");
    signupUrl.searchParams.set("nonce", nonce);
    signupUrl.searchParams.set("redirect_uri", COGNITO_REDIRECT_URI);
    signupUrl.searchParams.set("response_type", "code");
    signupUrl.searchParams.set("scope", "openid email");
    signupUrl.searchParams.set("state", state);

    req.session.save((err) => {
      if (err) return next(err);
      return res.redirect(signupUrl.toString());
    });
  } catch (error) {
    next(error);
  }
});

app.get("/callback", async (req, res, next) => {
  try {
    if (!req.session.state || !req.session.nonce || !req.session.codeVerifier) {
      return res.status(400).json({
        error: "auth_session_expired",
        message: "La session de connexion a expiré ou est incomplète.",
        action: `Va sur ${APP_URL} puis reconnecte-toi.`,
      });
    }

    const client = await getClient();
    const params = client.callbackParams(req);

    const tokenSet = await client.callback(COGNITO_REDIRECT_URI, params, {
      state: req.session.state,
      nonce: req.session.nonce,
      code_verifier: req.session.codeVerifier,
    });

    const userinfo = await client.userinfo(tokenSet.access_token);

    req.session.user = {
      sub: userinfo.sub,
      email: userinfo.email,
      email_verified: userinfo.email_verified,
      name: userinfo.name,
      given_name: userinfo.given_name,
      family_name: userinfo.family_name,
    };

    req.session.tokens = {
      id_token: tokenSet.id_token,
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token,
      expires_at: tokenSet.expires_at,
    };

    delete req.session.codeVerifier;
    delete req.session.state;
    delete req.session.nonce;

    req.session.save((err) => {
      if (err) return next(err);
      return res.redirect(APP_URL);
    });
  } catch (error) {
    next(error);
  }
});

app.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.json({
      authenticated: false,
      user: null,
      referralCode: null,
    });
  }

  return res.json({
    authenticated: true,
    user: req.session.user,
    referralCode: getReferralCode(req),
  });
});

app.get("/logout", (req, res) => {
  const idToken = req.session.tokens?.id_token;

  req.session.destroy(() => {
    if (COGNITO_DOMAIN && COGNITO_CLIENT_ID) {
      const logoutUrl = new URL(`${COGNITO_DOMAIN.replace(/\/$/, "")}/logout`);
      logoutUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
      logoutUrl.searchParams.set("logout_uri", COGNITO_LOGOUT_URI);

      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }

      return res.redirect(logoutUrl.toString());
    }

    return res.redirect(APP_URL);
  });
});

app.post("/api/referral-code", requireAuth, (req, res) => {
  const referralCode = getReferralCode(req);

  res.json({
    code: referralCode,
    ownerUserId: req.session.user.sub,
    message: "Code de référence généré pour cet utilisateur.",
  });
});

app.get("/api/profile", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const result = await dynamo.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: getUserPk(req),
          SK: "PROFILE",
        },
      })
    );

    res.json({
      profile: result.Item || null,
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const now = new Date().toISOString();

    const profile = {
      PK: getUserPk(req),
      SK: "PROFILE",
      type: "profile",
      userId: req.session.user.sub,
      email: req.session.user.email || "",
      ...cleanProfilePayload(req.body),
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: profile,
      })
    );

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/children", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": getUserPk(req),
          ":sk": "CHILD#",
        },
      })
    );

    const children = (result.Items || []).sort((a, b) => {
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });

    res.json({
      children,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/children", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const childId = randomUUID();
    const now = new Date().toISOString();

    const child = {
      PK: getUserPk(req),
      SK: `CHILD#${childId}`,
      id: childId,
      type: "child",
      ...cleanChildPayload(req.body),
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: child,
      })
    );

    res.status(201).json({
      success: true,
      child,
    });
  } catch (error) {
    next(error);
  }
});

app.put(
  "/api/children/:childId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { childId } = req.params;
      const now = new Date().toISOString();
      const payload = cleanChildPayload(req.body);

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `CHILD#${childId}`,
          },
          UpdateExpression:
            "SET firstName = :firstName, lastName = :lastName, birthDate = :birthDate, gender = :gender, color = :color, avatar = :avatar, notes = :notes, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":firstName": payload.firstName,
            ":lastName": payload.lastName,
            ":birthDate": payload.birthDate,
            ":gender": payload.gender,
            ":color": payload.color,
            ":avatar": payload.avatar,
            ":notes": payload.notes,
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      res.json({
        success: true,
        child: result.Attributes,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/children/:childId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { childId } = req.params;

      await dynamo.send(
        new DeleteCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `CHILD#${childId}`,
          },
        })
      );

      res.json({
        success: true,
        deletedId: childId,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/events", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": getUserPk(req),
          ":sk": "EVENT#",
        },
      })
    );

    const events = (result.Items || []).sort((a, b) => {
      return String(a.date || "").localeCompare(String(b.date || ""));
    });

    res.json({
      events,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/events", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const eventId = randomUUID();
    const now = new Date().toISOString();
    const payload = cleanEventPayload(req.body);

    const event = {
      PK: getUserPk(req),
      SK: `EVENT#${eventId}`,
      id: eventId,
      typeItem: "event",
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: event,
      })
    );

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
});

app.put(
  "/api/events/:eventId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const now = new Date().toISOString();
      const payload = cleanEventPayload(req.body);

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `EVENT#${eventId}`,
          },
          UpdateExpression:
            "SET title = :title, eventType = :eventType, childIds = :childIds, childNames = :childNames, #date = :date, #start = :start, #end = :end, note = :note, color = :color, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#date": "date",
            "#start": "start",
            "#end": "end",
          },
          ExpressionAttributeValues: {
            ":title": payload.title,
            ":eventType": payload.eventType,
            ":childIds": payload.childIds,
            ":childNames": payload.childNames,
            ":date": payload.date,
            ":start": payload.start,
            ":end": payload.end,
            ":note": payload.note,
            ":color": payload.color,
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      res.json({
        success: true,
        event: result.Attributes,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/events/:eventId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { eventId } = req.params;

      await dynamo.send(
        new DeleteCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `EVENT#${eventId}`,
          },
        })
      );

      res.json({
        success: true,
        deletedId: eventId,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/my-data", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": getUserPk(req),
        },
      })
    );

    res.json({
      items: result.Items || [],
    });
  } catch (error) {
    next(error);
  }
});

/* =========================
   Subscription / Abonnement
   ========================= */

app.get(
  "/api/subscription",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: "SUBSCRIPTION",
          },
        })
      );

      const subscription = result.Item || null;
      const activeStatuses = ["trialing", "active"];

      const hasAccess =
        subscription && activeStatuses.includes(subscription.status);

      return res.json({
        hasAccess: Boolean(hasAccess),
        status: subscription?.status || "none",
        subscription,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/subscription/sync-checkout",
  requireAuth,
  validateStripeConfig,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { session_id } = req.body;

      if (!session_id) {
        return res.status(400).json({
          error: "missing_session_id",
          message: "session_id est requis.",
        });
      }

      const checkoutSession = await stripe.checkout.sessions.retrieve(
        session_id,
        {
          expand: ["subscription"],
        }
      );

      const stripeSubscription = checkoutSession.subscription;

      if (!stripeSubscription) {
        return res.status(400).json({
          error: "missing_subscription",
          message: "Aucun abonnement Stripe trouvé pour cette session.",
        });
      }

      const now = new Date().toISOString();

      const subscriptionItem = {
        PK: getUserPk(req),
        SK: "SUBSCRIPTION",
        type: "subscription",
        userId: req.session.user.sub,
        email: req.session.user.email || "",
        status: stripeSubscription.status,
        plan:
          stripeSubscription.metadata?.plan ||
          checkoutSession.metadata?.plan ||
          STRIPE_PRICE_LOOKUP_KEY,
        storageGb:
          Number(stripeSubscription.metadata?.storageGb) ||
          Number(checkoutSession.metadata?.storageGb) ||
          Number(STRIPE_STORAGE_GB) ||
          5,
        stripeCustomerId: checkoutSession.customer || "",
        stripeSubscriptionId: stripeSubscription.id,
        stripeCheckoutSessionId: checkoutSession.id,
        trialEndsAt: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null,
        currentPeriodEnd: stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null,
        updatedAt: now,
        createdAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: subscriptionItem,
        })
      );

      return res.json({
        success: true,
        hasAccess: ["trialing", "active"].includes(subscriptionItem.status),
        status: subscriptionItem.status,
        subscription: subscriptionItem,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/documents/presign",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const payload = cleanDocumentPayload(req.body);

      if (!payload.fileName || !payload.fileType || !payload.childId) {
        return res.status(400).json({
          error: "missing_fields",
          message: "fileName, fileType et childId sont requis.",
        });
      }

      const ownerId = getOwnerId(req);
      const documentId = randomUUID();
      const now = new Date().toISOString();
      const cleanFileName = sanitizeFileName(payload.fileName);
      const s3Key = `users/${ownerId}/children/${payload.childId}/documents/${documentId}-${cleanFileName}`;

      const command = new PutObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: s3Key,
        ContentType: payload.fileType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 300,
      });

      const document = {
        PK: getUserPk(req),
        SK: `DOCUMENT#${documentId}`,
        id: documentId,
        type: "document",
        ownerId,
        childId: payload.childId,
        childName: payload.childName,
        category: payload.category,
        fileName: payload.fileName,
        fileType: payload.fileType,
        fileSize: payload.fileSize,
        s3Key,
        createdAt: now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: document,
        })
      );

      res.json({
        success: true,
        uploadUrl,
        document,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/documents", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": getUserPk(req),
          ":sk": "DOCUMENT#",
        },
      })
    );

    const documents = (result.Items || []).sort((a, b) => {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    res.json({
      documents,
    });
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/documents/:documentId/download",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { documentId } = req.params;

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `DOCUMENT#${documentId}`,
          },
        })
      );

      const document = result.Item;

      if (!document) {
        return res.status(404).json({
          error: "not_found",
          message: "Document introuvable.",
        });
      }

      const command = new GetObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: document.s3Key,
      });

      const downloadUrl = await getSignedUrl(s3, command, {
        expiresIn: 300,
      });

      res.json({
        success: true,
        downloadUrl,
        document,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/documents/:documentId",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { documentId } = req.params;

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `DOCUMENT#${documentId}`,
          },
        })
      );

      const document = result.Item;

      if (!document) {
        return res.status(404).json({
          error: "not_found",
          message: "Document introuvable.",
        });
      }

      await s3.send(
        new DeleteObjectCommand({
          Bucket: S3_DOCUMENTS_BUCKET,
          Key: document.s3Key,
        })
      );

      await dynamo.send(
        new DeleteCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `DOCUMENT#${documentId}`,
          },
        })
      );

      res.json({
        success: true,
        deletedId: documentId,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/photos/presign",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { fileName, fileType } = req.body;

      if (!fileName || !fileType) {
        return res.status(400).json({
          error: "missing_fields",
          message: "fileName et fileType sont requis.",
        });
      }

      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Ce type de photo n’est pas autorisé.",
        });
      }

      const ownerId = getOwnerId(req);
      const photoId = randomUUID();
      const cleanFileName = sanitizeFileName(fileName);
      const s3Key = `users/${ownerId}/photos/${photoId}-${cleanFileName}`;

      const command = new PutObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: s3Key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 300,
      });

      res.json({
        success: true,
        photoId,
        uploadUrl,
        s3Key,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/photos", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const { id, title, album, children = [], s3Key, fileName = "" } = req.body;

    if (!id || !title || !album || !s3Key) {
      return res.status(400).json({
        error: "missing_fields",
        message: "id, title, album et s3Key sont requis.",
      });
    }

    const now = new Date().toISOString();

    const photo = {
      PK: getUserPk(req),
      SK: `PHOTO#${id}`,
      id,
      type: "photo",
      title,
      album,
      children,
      s3Key,
      fileName,
      date: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: photo,
      })
    );

    res.json({
      success: true,
      photo,
    });
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/photos",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": getUserPk(req),
            ":sk": "PHOTO#",
          },
        })
      );

      const photos = await Promise.all(
        (result.Items || []).map(async (photo) => {
          const downloadUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: S3_DOCUMENTS_BUCKET,
              Key: photo.s3Key,
            }),
            { expiresIn: 3600 }
          );

          return {
            ...photo,
            url: downloadUrl,
          };
        })
      );

      photos.sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

      res.json({
        photos,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/photos/:photoId",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { photoId } = req.params;

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `PHOTO#${photoId}`,
          },
        })
      );

      const photo = result.Item;

      if (!photo) {
        return res.status(404).json({
          error: "not_found",
          message: "Photo introuvable.",
        });
      }

      await s3.send(
        new DeleteObjectCommand({
          Bucket: S3_DOCUMENTS_BUCKET,
          Key: photo.s3Key,
        })
      );

      await dynamo.send(
        new DeleteCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `PHOTO#${photoId}`,
          },
        })
      );

      res.json({
        success: true,
        deletedId: photoId,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================
   Stripe Checkout
   ========================= */

app.post(
  "/create-checkout-session",
  requireAuth,
  validateStripeConfig,
  async (req, res, next) => {
    try {
      const lookupKey = req.body.lookup_key || STRIPE_PRICE_LOOKUP_KEY;
      const wantsTrial = req.body.trial === true;

      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        expand: ["data.product"],
      });

      if (!prices.data.length) {
        return res.status(404).json({
          error: "stripe_price_not_found",
          message: `Aucun prix Stripe actif trouvé pour le lookup_key : ${lookupKey}`,
        });
      }

      const price = prices.data[0];

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: req.session.user.email || undefined,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/billing?canceled=true`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        metadata: {
          userId: req.session.user.sub,
          userEmail: req.session.user.email || "",
          plan: lookupKey,
          storageGb: STRIPE_STORAGE_GB,
          trial: wantsTrial ? "true" : "false",
        },
        subscription_data: {
          ...(wantsTrial ? { trial_period_days: 30 } : {}),
          metadata: {
            userId: req.session.user.sub,
            userEmail: req.session.user.email || "",
            plan: lookupKey,
            storageGb: STRIPE_STORAGE_GB,
            trial: wantsTrial ? "true" : "false",
          },
        },
      });

      return res.json({
        success: true,
        url: checkoutSession.url,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/create-portal-session",
  requireAuth,
  validateStripeConfig,
  async (req, res, next) => {
    try {
      const { session_id } = req.body;

      if (!session_id) {
        return res.status(400).json({
          error: "missing_session_id",
          message: "session_id est requis.",
        });
      }

      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

      if (!checkoutSession.customer) {
        return res.status(400).json({
          error: "stripe_customer_missing",
          message: "Aucun client Stripe trouvé pour cette session.",
        });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: `${APP_URL}/billing`,
      });

      return res.json({
        success: true,
        url: portalSession.url,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use((error, req, res, next) => {
  console.error(error);

  if (error.message && error.message.includes("Could not load credentials")) {
    return res.status(500).json({
      error: "aws_credentials_missing",
      message: "AWS ne trouve pas les identifiants.",
    });
  }

  if (error.message && error.message.includes("checks.state argument is missing")) {
    return res.status(400).json({
      error: "auth_state_missing",
      message:
        "La session de connexion Cognito est incomplète. Va sur /logout, puis reconnecte-toi depuis l’application.",
    });
  }

  if (error.name === "AccessDenied" || error.name === "AccessDeniedException") {
    return res.status(403).json({
      error: "aws_access_denied",
      message:
        "Les clés AWS sont présentes, mais elles n'ont pas les permissions nécessaires.",
      details: error.message,
    });
  }

  if (error.name === "NoSuchBucket") {
    return res.status(404).json({
      error: "s3_bucket_not_found",
      message: "Le bucket S3 est introuvable.",
      details: error.message,
    });
  }

  if (error.name === "ResourceNotFoundException") {
    return res.status(404).json({
      error: "dynamodb_table_not_found",
      message: "La table DynamoDB est introuvable.",
    });
  }

  res.status(500).json({
    error: "server_error",
    message: error.message || "Erreur serveur.",
  });
});

app.listen(PORT, () => {
  console.log(`Camelio server lancé sur http://localhost:${PORT}`);
});