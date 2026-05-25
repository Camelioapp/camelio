require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const DynamoDBStore = require("connect-dynamodb")({ session });
const helmet = require("helmet");
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
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { dynamo } = require("./dynamo");

const app = express();

app.set("trust proxy", 1);

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const PORT = process.env.PORT || 3001;

const APP_URL =
  process.env.APP_URL ||
  process.env.APP_BASE_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "CamelioData";
const SESSION_TABLE = process.env.SESSION_TABLE || "CamelioSessions";

const COGNITO_ISSUER = process.env.COGNITO_ISSUER;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || undefined;
const COGNITO_REDIRECT_URI =
  process.env.COGNITO_REDIRECT_URI || `http://localhost:${PORT}/callback`;
const COGNITO_LOGOUT_URI =
  process.env.COGNITO_LOGOUT_URI || "https://camelio.app";
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const ACCOUNT_DELETE_CONFIRMATION = "supprimer";

const AWS_SESSION_SECRET =
  process.env.AWS_SESSION_SECRET || process.env.SESSION_SECRET;

if (!AWS_SESSION_SECRET && IS_PRODUCTION) {
  throw new Error("AWS_SESSION_SECRET est requis en production.");
}

const AWS_SESSION_SECRET_VALUE =
  AWS_SESSION_SECRET || "dev-session-secret-only-for-local-development";

const AWS_REGION = process.env.AWS_REGION || "us-east-2";
const S3_REGION = process.env.S3_REGION || "ca-central-1";
const S3_DOCUMENTS_BUCKET = process.env.S3_DOCUMENTS_BUCKET;

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_LOOKUP_KEY =
  process.env.STRIPE_PRICE_LOOKUP_KEY || "camelio_monthly_595";
const STRIPE_STORAGE_GB = process.env.STRIPE_STORAGE_GB || "5";

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_CHILDREN_PER_ACCOUNT = 10;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
    })
  : null;

const s3 = new S3Client({
  region: S3_REGION,
});

const cognitoIdentityProvider = new CognitoIdentityProviderClient({
  region: AWS_REGION,
});

let oidcClientPromise = null;

app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

app.use(express.json({ limit: "10mb" }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (IS_PRODUCTION) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
});

const defaultAllowedOrigins = [
  "https://camelio-frontend.onrender.com",
  "https://camelio.app",
  "https://www.camelio.app",
  "https://api.camelio.app",
];

const envAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins])
);

if (!IS_PRODUCTION) {
  allowedOrigins.push("http://localhost:5173");
  allowedOrigins.push("http://localhost:3000");
  allowedOrigins.push("http://localhost:3001");
}

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

function validateTrustedOrigin(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");

  if (!origin && IS_PRODUCTION && !safeMethods.includes(req.method)) {
  return res.status(403).json({
    error: "missing_origin",
    message: "Origine manquante.",
  });
}

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: "invalid_origin",
      message: "Origine non autorisée.",
    });
  }

  return next();
}

app.use(validateTrustedOrigin);

app.set("trust proxy", 1);

app.use(validateTrustedOrigin);

app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "too_many_requests",
    message: "Trop de requêtes. Veuillez réessayer dans quelques minutes.",
  },
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "too_many_requests",
    message: "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
  },
});

app.use("/api", apiLimiter);
app.use("/login", sensitiveLimiter);
app.use("/signup", sensitiveLimiter);
app.use("/api/documents/presign", sensitiveLimiter);
app.use("/api/photos/presign", sensitiveLimiter);
app.use("/api/uploads/avatar", sensitiveLimiter);

const sessionStore = new DynamoDBStore({
  table: SESSION_TABLE,
  AWSConfigJSON: {
    region: AWS_REGION,
  },
  reapInterval: 60 * 60 * 1000,
});

app.use(
  session({
    name: "camelio.sid",
    secret: AWS_SESSION_SECRET_VALUE,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: IS_PRODUCTION ? "none" : "lax",
      secure: IS_PRODUCTION,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const checkAuth = (req, res, next) => {
  req.isAuthenticated = Boolean(req.session.user);
  next();
};

app.use(checkAuth);

function generateSevenDigitUserId() {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

async function generateUniqueSevenDigitUserId() {
  let attempts = 0;

  while (attempts < 10) {
    const candidate = generateSevenDigitUserId();

    const existing = await dynamo.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: `USERID#${candidate}`,
          SK: "LOOKUP",
        },
      })
    );

    if (!existing.Item) {
      return candidate;
    }

    attempts += 1;
  }

  throw new Error("Impossible de générer un User ID unique.");
}

function validateAwsConfig(req, res, next) {
  const missing = [];

  if (!process.env.AWS_REGION && IS_PRODUCTION) missing.push("AWS_REGION");
  if (!process.env.DYNAMODB_TABLE && IS_PRODUCTION) {
    missing.push("DYNAMODB_TABLE");
  }

  if (!process.env.AWS_ACCESS_KEY_ID && !IS_PRODUCTION) {
    missing.push("AWS_ACCESS_KEY_ID");
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY && !IS_PRODUCTION) {
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

  if (!process.env.S3_REGION && IS_PRODUCTION) missing.push("S3_REGION");

  if (!process.env.AWS_ACCESS_KEY_ID && !IS_PRODUCTION) {
    missing.push("AWS_ACCESS_KEY_ID");
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY && !IS_PRODUCTION) {
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

function validateCognitoAdminConfig(req, res, next) {
  const missing = [];

  if (!process.env.COGNITO_USER_POOL_ID) {
    missing.push("COGNITO_USER_POOL_ID");
  }

  if (missing.length > 0) {
    return res.status(500).json({
      error: "cognito_admin_config_missing",
      message: "Configuration Cognito incomplète pour supprimer le compte.",
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
    nickname: body.nickname || "",
    birthDate: body.birthDate || "",
    gender: body.gender || body.sex || "",
    color: body.color || "sage",
    avatar: body.avatar || "",
    photo: body.photo || body.avatar || "",
    image: body.image || body.avatar || body.photo || "",
    avatarS3Key: body.avatarS3Key || "",
    photoPosition: body.photoPosition || {
      x: 50,
      y: 50,
    },
    photoZoom: Number(body.photoZoom) || 1,
    notes: body.notes || body.profileNote || "",
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

function inferDocumentFileType(fileName = "", fileType = "") {
  const normalizedType = String(fileType || "").trim();

  if (normalizedType) return normalizedType;

  const lowerName = String(fileName || "").toLowerCase();

  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".doc")) return "application/msword";
  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "";
}

function sanitizeFileName(fileName = "") {
  return String(fileName)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 180);
}

function isAllowedImageType(fileType) {
  return ALLOWED_IMAGE_TYPES.includes(fileType);
}

function isAllowedDocumentType(fileType) {
  return ALLOWED_DOCUMENT_TYPES.includes(fileType);
}

function isValidFileSize(fileSize, maxSizeBytes) {
  const size = Number(fileSize);
  return Number.isFinite(size) && size > 0 && size <= maxSizeBytes;
}

function isSafeS3KeyForOwner(s3Key = "", ownerId = "") {
  return String(s3Key).startsWith(`users/${ownerId}/`);
}

async function deleteAllUserDynamoItems(userPk) {
  const allItems = [];
  let lastEvaluatedKey;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": userPk,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    allItems.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  for (let i = 0; i < allItems.length; i += 25) {
    const batch = allItems.slice(i, i + 25);

    if (batch.length === 0) continue;

    await dynamo.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE]: batch.map((item) => ({
            DeleteRequest: {
              Key: {
                PK: item.PK,
                SK: item.SK,
              },
            },
          })),
        },
      })
    );
  }

  return allItems;
}

async function deleteUserIdLookup(userId) {
  const cleanUserId = String(userId || "").replace(/\D/g, "").slice(0, 7);

  if (!cleanUserId) return;

  await dynamo.send(
    new DeleteCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: `USERID#${cleanUserId}`,
        SK: "LOOKUP",
      },
    })
  );
}

async function deleteAllUserS3Objects(ownerId) {
  if (!S3_DOCUMENTS_BUCKET || !ownerId) return;

  const prefix = `users/${ownerId}/`;
  let continuationToken;

  do {
    const listResult = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_DOCUMENTS_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = listResult.Contents || [];

    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: S3_DOCUMENTS_BUCKET,
          Delete: {
            Objects: objects.map((object) => ({
              Key: object.Key,
            })),
            Quiet: true,
          },
        })
      );
    }

    continuationToken = listResult.IsTruncated
      ? listResult.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

async function deleteCognitoUser(req) {
  const possibleUsernames = [
    req.session.user?.sub,
    req.session.user?.email,
  ].filter(Boolean);

  let lastError = null;

  for (const username of possibleUsernames) {
    try {
      await cognitoIdentityProvider.send(
        new AdminDeleteUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: username,
        })
      );

      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Impossible de supprimer l’utilisateur Cognito.");
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
  if (IS_PRODUCTION) {
    return res.status(403).json({
      error: "forbidden",
      message: "Cette route est désactivée en production.",
    });
  }

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
  const logoutRedirectUrl = COGNITO_LOGOUT_URI || "https://camelio.app";

  req.session.destroy(() => {
    res.clearCookie("camelio.sid", {
      httpOnly: true,
      sameSite: IS_PRODUCTION ? "none" : "lax",
      secure: IS_PRODUCTION,
    });

    if (COGNITO_DOMAIN && COGNITO_CLIENT_ID) {
      const logoutUrl = new URL(`${COGNITO_DOMAIN.replace(/\/$/, "")}/logout`);
      logoutUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
      logoutUrl.searchParams.set("logout_uri", logoutRedirectUrl);

      return res.redirect(logoutUrl.toString());
    }

    return res.redirect(logoutRedirectUrl);
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
    const now = new Date().toISOString();
    const userPk = getUserPk(req);

    const result = await dynamo.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: userPk,
          SK: "PROFILE",
        },
      })
    );

    const existingUserId = result.Item?.userId
      ? String(result.Item.userId).replace(/\D/g, "").slice(0, 7)
      : "";

    const hasValidSevenDigitUserId = /^\d{7}$/.test(existingUserId);

    let userId = existingUserId;

    if (!hasValidSevenDigitUserId) {
      userId = await generateUniqueSevenDigitUserId();

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: {
            PK: `USERID#${userId}`,
            SK: "LOOKUP",
            type: "userIdLookup",
            userPk,
            cognitoSub: req.session.user.sub,
            email: req.session.user.email || "",
            createdAt: now,
          },
        })
      );
    }

    const profile = {
      ...(result.Item || {}),
      PK: userPk,
      SK: "PROFILE",
      type: "profile",
      userId,
      cognitoSub: req.session.user.sub,
      email: result.Item?.email || req.session.user.email || "",
      name:
        result.Item?.name ||
        result.Item?.displayName ||
        req.session.user.name ||
        req.session.user.given_name ||
        "",
      displayName:
        result.Item?.displayName ||
        result.Item?.name ||
        req.session.user.name ||
        req.session.user.given_name ||
        "",
      phone: result.Item?.phone || "",
      preferredLanguage: result.Item?.preferredLanguage || "fr",
      createdAt: result.Item?.createdAt || now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: profile,
      })
    );

    return res.json({
      profile,
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const userPk = getUserPk(req);

    const existingResult = await dynamo.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: userPk,
          SK: "PROFILE",
        },
      })
    );

    const existingUserId = existingResult.Item?.userId
      ? String(existingResult.Item.userId).replace(/\D/g, "").slice(0, 7)
      : "";

    const hasValidSevenDigitUserId = /^\d{7}$/.test(existingUserId);

    let userId = existingUserId;

    if (!hasValidSevenDigitUserId) {
      userId = await generateUniqueSevenDigitUserId();

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: {
            PK: `USERID#${userId}`,
            SK: "LOOKUP",
            type: "userIdLookup",
            userPk,
            cognitoSub: req.session.user.sub,
            email: req.session.user.email || "",
            createdAt: now,
          },
        })
      );
    }

    const cleanedProfile = cleanProfilePayload(req.body);

    const profile = {
      ...(existingResult.Item || {}),
      PK: userPk,
      SK: "PROFILE",
      type: "profile",
      userId,
      cognitoSub: req.session.user.sub,
      email: req.session.user.email || existingResult.Item?.email || "",
      name:
        req.body.name ||
        cleanedProfile.displayName ||
        existingResult.Item?.name ||
        existingResult.Item?.displayName ||
        "",
      displayName:
        cleanedProfile.displayName ||
        req.body.name ||
        existingResult.Item?.displayName ||
        existingResult.Item?.name ||
        "",
      phone: cleanedProfile.phone || "",
      preferredLanguage: cleanedProfile.preferredLanguage || "fr",
      createdAt: existingResult.Item?.createdAt || now,
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
    const existingChildrenResult = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": getUserPk(req),
          ":sk": "CHILD#",
        },
      })
    );

    const existingChildrenCount = existingChildrenResult.Items?.length || 0;

    if (existingChildrenCount >= MAX_CHILDREN_PER_ACCOUNT) {
      return res.status(403).json({
        error: "children_limit_reached",
        message: `Vous avez atteint la limite de ${MAX_CHILDREN_PER_ACCOUNT} enfants pour ce compte.`,
      });
    }

    const childId = req.body.id || randomUUID();
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
            "SET firstName = :firstName, lastName = :lastName, nickname = :nickname, birthDate = :birthDate, gender = :gender, color = :color, avatar = :avatar, photo = :photo, #image = :image, avatarS3Key = :avatarS3Key, photoPosition = :photoPosition, photoZoom = :photoZoom, notes = :notes, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#image": "image",
          },
          ExpressionAttributeValues: {
            ":firstName": payload.firstName,
            ":lastName": payload.lastName,
            ":nickname": payload.nickname,
            ":birthDate": payload.birthDate,
            ":gender": payload.gender,
            ":color": payload.color,
            ":avatar": payload.avatar,
            ":photo": payload.photo,
            ":image": payload.image,
            ":avatarS3Key": payload.avatarS3Key,
            ":photoPosition": payload.photoPosition,
            ":photoZoom": payload.photoZoom,
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
        plan: subscription?.plan || null,
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        trialEnd: subscription?.trialEnd || null,
        cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/subscription/invoices",
  requireAuth,
  validateStripeConfig,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const subscriptionResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: "SUBSCRIPTION",
          },
        })
      );

      const subscription = subscriptionResult.Item || null;

      if (!subscription?.stripeCustomerId) {
        return res.json({
          invoices: [],
          message: "Aucun client Stripe trouvé pour ce compte.",
        });
      }

      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 20,
      });

      const invoices = (stripeInvoices.data || []).map((invoice) => ({
        id: invoice.id,
        number: invoice.number || invoice.id,
        status: invoice.status || "unknown",
        amountPaid: invoice.amount_paid || 0,
        amountDue: invoice.amount_due || 0,
        amountRemaining: invoice.amount_remaining || 0,
        currency: invoice.currency || "cad",
        createdAt: invoice.created
          ? new Date(invoice.created * 1000).toISOString()
          : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || "",
        invoicePdf: invoice.invoice_pdf || "",
      }));

      return res.json({
        invoices,
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

      if (checkoutSession.metadata?.userId !== req.session.user.sub) {
        return res.status(403).json({
          error: "forbidden_checkout_session",
          message: "Cette session Stripe n’appartient pas à cet utilisateur.",
        });
      }

      const stripeSubscription = checkoutSession.subscription;

      if (!stripeSubscription) {
        return res.status(400).json({
          error: "missing_subscription",
          message: "Aucun abonnement Stripe trouvé pour cette session.",
        });
      }

      if (stripeSubscription.metadata?.userId !== req.session.user.sub) {
        return res.status(403).json({
          error: "forbidden_subscription",
          message: "Cet abonnement Stripe n’appartient pas à cet utilisateur.",
        });
      }

      const now = new Date().toISOString();

      const trialEnd = stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000).toISOString()
        : null;

      const currentPeriodEnd = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : null;

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
        trialEnd,
        trialEndsAt: trialEnd,
        currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
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
        plan: subscriptionItem.plan,
        storageGb: subscriptionItem.storageGb,
        trialEnd: subscriptionItem.trialEnd,
        trialEndsAt: subscriptionItem.trialEndsAt,
        currentPeriodEnd: subscriptionItem.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionItem.cancelAtPeriodEnd,
        subscription: subscriptionItem,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================
   Documents
   ========================= */

app.post(
  "/api/documents/presign",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      function cleanDocumentPayload(body = {}) {
  const fileName = body.fileName || "";
  const fileType = inferDocumentFileType(fileName, body.fileType);

  return {
    fileName,
    fileType,
    fileSize: Number(body.fileSize) || 0,
    childId: body.childId || "",
    childName: body.childName || "",
    category: body.category || body.type || "Document",
    title: body.title || fileName || "Document",
    note: body.note || "",
  };
}

      if (!isAllowedDocumentType(payload.fileType)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Ce type de document n’est pas autorisé.",
        });
      }

      if (!isValidFileSize(payload.fileSize, MAX_DOCUMENT_SIZE_BYTES)) {
        return res.status(400).json({
          error: "invalid_file_size",
          message:
            "Le document doit être supérieur à 0 octet et ne pas dépasser 10 MB.",
        });
      }

      const ownerId = getOwnerId(req);
      const documentId = randomUUID();
      const now = new Date().toISOString();
      const cleanFileName = sanitizeFileName(payload.fileName);
      const s3Key = `users/${ownerId}/children/${payload.childId}/documents/${documentId}-${cleanFileName}`;

      if (!isSafeS3KeyForOwner(s3Key, ownerId)) {
        return res.status(400).json({
          error: "invalid_s3_key",
          message: "Clé S3 invalide.",
        });
      }

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
  title: payload.title,
  note: payload.note,
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

      const ownerId = getOwnerId(req);

      if (!isSafeS3KeyForOwner(document.s3Key, ownerId)) {
        return res.status(403).json({
          error: "forbidden_s3_key",
          message: "Accès refusé à ce document.",
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

      const ownerId = getOwnerId(req);

      if (!isSafeS3KeyForOwner(document.s3Key, ownerId)) {
        return res.status(403).json({
          error: "forbidden_s3_key",
          message: "Accès refusé à ce document.",
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

/* =========================
   Avatars
   ========================= */

app.post(
  "/api/uploads/avatar",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { fileName, fileType, childId, fileSize } = req.body;

      if (!fileName || !fileType) {
        return res.status(400).json({
          error: "missing_fields",
          message: "fileName et fileType sont requis.",
        });
      }

      if (!isAllowedImageType(fileType)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Ce type d’image n’est pas autorisé.",
        });
      }

      if (fileSize && !isValidFileSize(fileSize, MAX_IMAGE_SIZE_BYTES)) {
        return res.status(400).json({
          error: "invalid_file_size",
          message: "L’image doit ne pas dépasser 5 MB.",
        });
      }

      const ownerId = getOwnerId(req);
      const avatarId = randomUUID();
      const cleanFileName = sanitizeFileName(fileName);
      const safeChildId = childId || "general";

      const s3Key = `users/${ownerId}/children/${safeChildId}/avatars/${avatarId}-${cleanFileName}`;

      if (!isSafeS3KeyForOwner(s3Key, ownerId)) {
        return res.status(400).json({
          error: "invalid_s3_key",
          message: "Clé S3 invalide.",
        });
      }

      const uploadCommand = new PutObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: s3Key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3, uploadCommand, {
        expiresIn: 300,
      });

      const downloadCommand = new GetObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: s3Key,
      });

      const downloadUrl = await getSignedUrl(s3, downloadCommand, {
        expiresIn: 3600,
      });

      return res.json({
        success: true,
        avatarId,
        uploadUrl,
        downloadUrl,
        s3Key,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================
   Photos
   ========================= */

app.post(
  "/api/photos/presign",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { fileName, fileType, fileSize } = req.body;

      if (!fileName || !fileType) {
        return res.status(400).json({
          error: "missing_fields",
          message: "fileName et fileType sont requis.",
        });
      }

      if (!isAllowedImageType(fileType)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Ce type de photo n’est pas autorisé.",
        });
      }

      if (fileSize && !isValidFileSize(fileSize, MAX_IMAGE_SIZE_BYTES)) {
        return res.status(400).json({
          error: "invalid_file_size",
          message: "La photo doit ne pas dépasser 5 MB.",
        });
      }

      const ownerId = getOwnerId(req);
      const photoId = randomUUID();
      const cleanFileName = sanitizeFileName(fileName);
      const s3Key = `users/${ownerId}/photos/${photoId}-${cleanFileName}`;

      if (!isSafeS3KeyForOwner(s3Key, ownerId)) {
        return res.status(400).json({
          error: "invalid_s3_key",
          message: "Clé S3 invalide.",
        });
      }

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

    const ownerId = getOwnerId(req);

    if (!isSafeS3KeyForOwner(s3Key, ownerId)) {
      return res.status(403).json({
        error: "forbidden_s3_key",
        message: "Clé S3 non autorisée pour cet utilisateur.",
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
      children: Array.isArray(children) ? children : [],
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

      const ownerId = getOwnerId(req);

      const photos = await Promise.all(
        (result.Items || []).map(async (photo) => {
          if (!isSafeS3KeyForOwner(photo.s3Key, ownerId)) {
            return {
              ...photo,
              url: "",
              blocked: true,
            };
          }

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

      const ownerId = getOwnerId(req);

      if (!isSafeS3KeyForOwner(photo.s3Key, ownerId)) {
        return res.status(403).json({
          error: "forbidden_s3_key",
          message: "Accès refusé à cette photo.",
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
  async (req, res) => {
    try {
      const lookupKey = req.body?.lookup_key || STRIPE_PRICE_LOOKUP_KEY;

      // Important : par défaut, on NE met PAS d'essai gratuit.
      // L'essai est activé seulement si le frontend envoie explicitement trial: true.
      const wantsTrial = req.body?.trial === true;

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

      const subscriptionData = {
        metadata: {
          userId: req.session.user.sub,
          userEmail: req.session.user.email || "",
          plan: lookupKey,
          storageGb: STRIPE_STORAGE_GB,
          trial: wantsTrial ? "true" : "false",
        },
      };

      if (wantsTrial) {
        subscriptionData.trial_period_days = 30;
      }

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

        // Important : Stripe demandera une méthode de paiement.
        payment_method_collection: "always",

        metadata: {
          userId: req.session.user.sub,
          userEmail: req.session.user.email || "",
          plan: lookupKey,
          storageGb: STRIPE_STORAGE_GB,
          trial: wantsTrial ? "true" : "false",
        },

        subscription_data: subscriptionData,
      });

      return res.json({
        success: true,
        url: checkoutSession.url,
      });
    } catch (error) {
      console.error("STRIPE CHECKOUT ERROR:", error);

      return res.status(500).json({
        error: "stripe_checkout_error",
        message:
          error.message ||
          "Impossible de créer la session de paiement Stripe.",
      });
    }
  }
);

app.post(
  "/create-portal-session",
  requireAuth,
  validateStripeConfig,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const subscriptionResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: "SUBSCRIPTION",
          },
        })
      );

      const subscription = subscriptionResult.Item || null;

      if (!subscription?.stripeCustomerId) {
        return res.status(400).json({
          error: "stripe_customer_missing",
          message: "Aucun client Stripe trouvé pour ce compte.",
        });
      }

      if (subscription.userId && subscription.userId !== req.session.user.sub) {
        return res.status(403).json({
          error: "forbidden_customer",
          message: "Ce client Stripe n’appartient pas à cet utilisateur.",
        });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
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

/* =========================
   Suppression de compte
   ========================= */

app.delete(
  "/api/account",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  validateCognitoAdminConfig,
  async (req, res, next) => {
    try {
      const confirmation = String(req.body?.confirmation || "")
        .trim()
        .toLowerCase();

      if (confirmation !== ACCOUNT_DELETE_CONFIRMATION) {
        return res.status(400).json({
          error: "invalid_confirmation",
          message: 'Pour confirmer, inscrivez exactement "supprimer".',
        });
      }

      const userPk = getUserPk(req);
      const ownerId = getOwnerId(req);

      const profileResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: "PROFILE",
          },
        })
      );

      const profileUserId = profileResult.Item?.userId;

      await deleteAllUserS3Objects(ownerId);
      await deleteAllUserDynamoItems(userPk);
      await deleteUserIdLookup(profileUserId);
      await deleteCognitoUser(req);

      req.session.destroy(() => {
        res.clearCookie("camelio.sid", {
          httpOnly: true,
          sameSite: IS_PRODUCTION ? "none" : "lax",
          secure: IS_PRODUCTION,
        });

        return res.json({
          success: true,
          redirectUrl: "https://camelio.app",
          message: "Compte supprimé avec succès.",
        });
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use((error, req, res, next) => {
  console.error(error);

  if (error.message && error.message.includes("CORS blocked for origin")) {
    return res.status(403).json({
      error: "cors_blocked",
      message: "Origine non autorisée.",
    });
  }

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
      details: IS_PRODUCTION ? undefined : error.message,
    });
  }

  if (error.name === "NoSuchBucket") {
    return res.status(404).json({
      error: "s3_bucket_not_found",
      message: "Le bucket S3 est introuvable.",
      details: IS_PRODUCTION ? undefined : error.message,
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
    message: IS_PRODUCTION
      ? "Erreur serveur."
      : error.message || "Erreur serveur.",
  });
});

app.listen(PORT, () => {
  console.log(`Camelio server lancé sur http://localhost:${PORT}`);
});