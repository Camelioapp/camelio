require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const DynamoDBStore = require("connect-dynamodb")({ session });
const helmet = require("helmet");
const cors = require("cors");
const { Issuer, generators } = require("openid-client");
const { randomUUID, createHash, timingSafeEqual } = require("crypto");
const Stripe = require("stripe");

const {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  ScanCommand,
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
  AdminCreateUserCommand,
  ListUsersCommand,
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

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  "Camelio <onboarding@resend.dev>";
const EMAIL_REPLY_TO =
  process.env.RESEND_MAIL_REPLY_TO ||
  process.env.RESEND_REPLY_TO ||
  process.env.EMAIL_REPLY_TO ||
  process.env.MAIL_REPLY_TO ||
  "info@camelio.app";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "CamelioData";
const SUBSCRIPTIONS_TABLE =
  process.env.SUBSCRIPTIONS_TABLE || "CamelioSubscriptions";
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
const STRIPE_PRICE_LOOKUP_KEY_SOLO =
  process.env.STRIPE_PRICE_LOOKUP_KEY_SOLO ||
  process.env.STRIPE_PRICE_LOOKUP_KEY_PARENT_SOLO ||
  "camelio_solo_monthly";
const STRIPE_PRICE_LOOKUP_KEY_DUO =
  process.env.STRIPE_PRICE_LOOKUP_KEY_DUO ||
  process.env.STRIPE_PRICE_LOOKUP_KEY_PARENT_DUO ||
  "camelio_duo_monthly";
const STRIPE_PRICE_LOOKUP_KEY_FAMILLE_PLUS =
  process.env.STRIPE_PRICE_LOOKUP_KEY_FAMILLE_PLUS ||
  process.env.STRIPE_PRICE_LOOKUP_KEY_FAMILY_PLUS ||
  process.env.STRIPE_PRICE_LOOKUP_KEY_PREMIUM ||
  "camelio_famille_plus_monthly";
const STRIPE_STORAGE_GB = process.env.STRIPE_STORAGE_GB || "5";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const CAMELIO_PLANS = {
  solo: {
    id: "solo",
    label: "Solo",
    lookupKey: STRIPE_PRICE_LOOKUP_KEY_SOLO,
    storageGb: 5,
    guestLimit: 0,
  },
  duo: {
    id: "duo",
    label: "Duo",
    lookupKey: STRIPE_PRICE_LOOKUP_KEY_DUO,
    storageGb: 10,
    guestLimit: 1,
  },
  famille_plus: {
    id: "famille_plus",
    label: "Famille+",
    lookupKey: STRIPE_PRICE_LOOKUP_KEY_FAMILLE_PLUS,
    storageGb: 50,
    guestLimit: 5,
  },
};

function getCamelioPlan(planIdOrLookupKey) {
  const raw = String(planIdOrLookupKey || "").trim();
  const normalized = raw.toLowerCase().replace(/[ -]/g, "_");

  if (CAMELIO_PLANS[normalized]) return CAMELIO_PLANS[normalized];

  return (
    Object.values(CAMELIO_PLANS).find(
      (plan) => plan.lookupKey === raw || plan.lookupKey.toLowerCase() === normalized
    ) || CAMELIO_PLANS.solo
  );
}


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

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) {
      return res.status(500).json({
        error: "stripe_not_configured",
        message: "Stripe n'est pas configuré.",
      });
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({
        error: "stripe_webhook_secret_missing",
        message: "STRIPE_WEBHOOK_SECRET est manquant.",
      });
    }

    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("STRIPE WEBHOOK SIGNATURE ERROR:", error.message);

      return res.status(400).json({
        error: "invalid_stripe_signature",
        message: error.message,
      });
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
case "customer.subscription.updated":
case "customer.subscription.deleted": {
  const stripeSubscription = event.data.object;

  const updatedSubscription = await upsertSubscriptionFromStripe(
    stripeSubscription
  );

  console.log("Stripe subscription reçue:", {
    eventType: event.type,
    stripeSubscriptionId: stripeSubscription.id,
    status: stripeSubscription.status,
    hasCamelioUserId: Boolean(stripeSubscription.metadata?.userId),
    updated: Boolean(updatedSubscription),
  });

  break;
}

        default:
          console.log(`Webhook Stripe ignoré: ${event.type}`);
      }

      return res.json({
        received: true,
      });
    } catch (error) {
      console.error("STRIPE WEBHOOK PROCESSING ERROR:", error);

      return res.status(500).json({
        error: "stripe_webhook_processing_error",
        message: "Erreur pendant le traitement du webhook Stripe.",
      });
    }
  }
);

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
app.use("/api/shared-documents", sensitiveLimiter);
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
  if (!process.env.SUBSCRIPTIONS_TABLE && IS_PRODUCTION) {
    missing.push("SUBSCRIPTIONS_TABLE");
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

async function ensureSubscriptionPlaceholder(req) {
  const now = new Date().toISOString();
  const userPk = getUserPk(req);

  const result = await dynamo.send(
    new GetCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: {
        PK: userPk,
        SK: "SUBSCRIPTION",
      },
    })
  );

  if (result.Item) {
    return result.Item;
  }

  const placeholder = {
    PK: userPk,
    SK: "SUBSCRIPTION",
    type: "subscription",
    userId: req.session.user.sub,
    email: req.session.user.email || "",
    status: "none",
    plan: null,
    accountType: "pending",
    subscriptionRequired: true,
    source: "profile_created",
    stripeCustomerId: "",
    stripeSubscriptionId: "",
    stripeCheckoutSessionId: "",
    storageGb: 0,
    trialEnd: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: placeholder,
    })
  );

  return placeholder;
}

async function upsertSubscriptionFromStripe(stripeSubscription) {
  const userId = stripeSubscription.metadata?.userId;

if (!userId) {
  console.warn(
    "Webhook Stripe ignoré : aucun userId dans metadata de l'abonnement.",
    stripeSubscription.id
  );
  return null;
}

  const now = new Date().toISOString();

  const trialEnd = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000).toISOString()
    : null;

  const currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
    : null;

  const canceledAt = stripeSubscription.canceled_at
    ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
    : null;

  const endedAt = stripeSubscription.ended_at
    ? new Date(stripeSubscription.ended_at * 1000).toISOString()
    : null;

  const subscriptionItem = {
    PK: `USER#${userId}`,
    SK: "SUBSCRIPTION",
    type: "subscription",
    userId,
    email: stripeSubscription.metadata?.userEmail || "",
    status: stripeSubscription.status,
    plan: stripeSubscription.metadata?.plan || STRIPE_PRICE_LOOKUP_KEY,
    storageGb: Number(stripeSubscription.metadata?.storageGb) || Number(STRIPE_STORAGE_GB) || 5,
    stripeCustomerId: stripeSubscription.customer || "",
    stripeSubscriptionId: stripeSubscription.id,
    trialEnd,
    trialEndsAt: trialEnd,
    currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    canceledAt,
    endedAt,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: subscriptionItem,
    })
  );

  return subscriptionItem;
}

function getDemoUserPk(req) {
  return req.session.user?.sub ? getUserPk(req) : "USER#demo-user";
}

function getOwnerId(req) {
  return req.session.user?.sub || "demo-user";
}


const ACCOUNT_PERMISSION_WEIGHT = {
  read: 1,
  edit: 2,
  delete: 3,
};

function normalizeAccountPermission(value = "read") {
  return ["read", "edit", "delete"].includes(value) ? value : "read";
}

function hasRequiredAccountPermission(currentPermission = "read", requiredPermission = "read") {
  const currentWeight = ACCOUNT_PERMISSION_WEIGHT[normalizeAccountPermission(currentPermission)] || 1;
  const requiredWeight = ACCOUNT_PERMISSION_WEIGHT[normalizeAccountPermission(requiredPermission)] || 1;
  return currentWeight >= requiredWeight;
}

function isGuestAccountId(accountId = "") {
  return String(accountId || "").startsWith("guest-");
}

function getImportedShareIdFromAccountId(accountId = "") {
  return String(accountId || "").replace(/^guest-/, "").trim();
}

async function getCurrentUserProfile(req) {
  const result = await dynamo.send(
    new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: getUserPk(req),
        SK: "PROFILE",
      },
    })
  );

  return result.Item || null;
}

async function getSourceProfileShareForImportedShare(importedShare) {
  if (!importedShare?.sourceOwnerUserId || !importedShare?.sourceShareId) {
    return null;
  }

  const result = await dynamo.send(
    new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: `USER#${importedShare.sourceOwnerUserId}`,
        SK: `SHARE#${importedShare.sourceShareId}`,
      },
    })
  );

  return result.Item || null;
}

async function revokeImportedShareLocally(importedShare, reason = "owner_revoked") {
  if (!importedShare?.PK || !importedShare?.SK || importedShare.status === "revoked") {
    return;
  }

  const now = new Date().toISOString();

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: importedShare.PK,
          SK: importedShare.SK,
        },
        UpdateExpression:
          "SET #status = :status, revokedAt = :revokedAt, revokedReason = :revokedReason, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "revoked",
          ":revokedAt": now,
          ":revokedReason": reason,
          ":updatedAt": now,
        },
        ReturnValues: "NONE",
      })
    );
  } catch (error) {
    console.warn("Impossible de révoquer localement l’accès invité:", error?.message || error);
  }
}

async function isImportedShareStillActive(importedShare) {
  if (!importedShare || importedShare.status === "revoked") {
    return false;
  }

  const sourceShare = await getSourceProfileShareForImportedShare(importedShare);

  if (!sourceShare || sourceShare.status === "revoked") {
    await revokeImportedShareLocally(importedShare, "owner_revoked");
    return false;
  }

  return true;
}

async function setActiveGuestAccountId(req, importedShareId = "") {
  const cleanImportedShareId = String(importedShareId || "").trim();

  if (!cleanImportedShareId) return;

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: getUserPk(req),
          SK: "PROFILE",
        },
        UpdateExpression:
          "SET activeAccountId = :activeAccountId, welcomeCompleted = :welcomeCompleted, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":activeAccountId": `guest-${cleanImportedShareId}`,
          ":welcomeCompleted": true,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "NONE",
      })
    );
  } catch (error) {
    console.warn(
      "Impossible de définir le compte invité actif:",
      error?.message || error
    );
  }
}

async function getImportedShareByIdForUserPk(userPk, importedShareId = "") {
  const cleanImportedShareId = String(importedShareId || "").trim();

  if (!cleanImportedShareId) return null;

  const result = await dynamo.send(
    new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: userPk,
        SK: `IMPORTED_SHARE#${cleanImportedShareId}`,
      },
    })
  );

  const share = result.Item || null;

  if (!(await isImportedShareStillActive(share))) {
    return null;
  }

  return share;
}

async function getActiveImportedShare(req) {
  const userPk = getUserPk(req);
  const profile = await getCurrentUserProfile(req);
  const activeAccountId = String(profile?.activeAccountId || "");

  if (isGuestAccountId(activeAccountId)) {
    const importedShareId = getImportedShareIdFromAccountId(activeAccountId);
    const activeShare = await getImportedShareByIdForUserPk(userPk, importedShareId);

    if (activeShare) return activeShare;
  }

  const subscriptionResult = await dynamo.send(
    new GetCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: {
        PK: userPk,
        SK: "SUBSCRIPTION",
      },
    })
  );

  const subscription = subscriptionResult.Item || null;

  if (subscription?.status === "guest" && subscription?.importedShareId) {
    const subscriptionShare = await getImportedShareByIdForUserPk(
      userPk,
      subscription.importedShareId
    );

    if (subscriptionShare) {
      await setActiveGuestAccountId(req, subscriptionShare.id);
      return subscriptionShare;
    }
  }

  const importedSharesResult = await dynamo.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": userPk,
        ":sk": "IMPORTED_SHARE#",
      },
    })
  );

  const activeShares = [];

  for (const share of importedSharesResult.Items || []) {
    if (await isImportedShareStillActive(share)) {
      activeShares.push(share);
    }
  }

  activeShares.sort((a, b) =>
    String(b.importedAt || b.createdAt || "").localeCompare(
      String(a.importedAt || a.createdAt || "")
    )
  );

  const fallbackShare = activeShares[0] || null;

  if (fallbackShare && subscription?.status === "guest") {
    await setActiveGuestAccountId(req, fallbackShare.id);
  }

  return fallbackShare;
}

function getShareSectionPermission(share, sectionId) {
  if (!share || !sectionId) return null;

  const sectionIds = Array.isArray(share.sectionIds) ? share.sectionIds : [];

  if (!sectionIds.includes(sectionId)) {
    return null;
  }

  const permission = share.sectionPermissions?.[sectionId] || share.permission || "read";

  return normalizeAccountPermission(permission);
}

async function getDataAccessContext(req, sectionId, requiredPermission = "read") {
  const profile = await getCurrentUserProfile(req);
  const activeAccountId = String(profile?.activeAccountId || "");
  const share = await getActiveImportedShare(req);

  if (!share) {
    if (isGuestAccountId(activeAccountId)) {
      const error = new Error(
        "Cet accès invité a été retiré ou révoqué. Sélectionnez un autre compte ou demandez une nouvelle invitation."
      );
      error.statusCode = 403;
      error.errorCode = "guest_access_revoked";
      throw error;
    }

    return {
      isGuest: false,
      dataPk: getUserPk(req),
      ownerId: getOwnerId(req),
      share: null,
      permission: "delete",
    };
  }

  const permission = getShareSectionPermission(share, sectionId);

  if (!permission || !hasRequiredAccountPermission(permission, requiredPermission)) {
    const message =
      requiredPermission === "read"
        ? "Cette section n’est pas partagée avec votre compte invité."
        : "Votre compte invité n’a pas les droits requis pour modifier cette section.";

    const error = new Error(message);
    error.statusCode = 403;
    error.errorCode = "guest_permission_denied";
    throw error;
  }

  if (!share.sourceOwnerUserId) {
    const error = new Error("Le compte propriétaire associé à cet accès invité est introuvable.");
    error.statusCode = 403;
    error.errorCode = "missing_guest_owner";
    throw error;
  }

  return {
    isGuest: true,
    dataPk: `USER#${share.sourceOwnerUserId}`,
    ownerId: share.sourceOwnerUserId,
    share,
    permission,
  };
}

function getSharedChildIds(share) {
  return new Set(
    (Array.isArray(share?.childIds) ? share.childIds : [])
      .map((childId) => String(childId || ""))
      .filter(Boolean)
  );
}

function isChildAllowedForShare(share, childId) {
  if (!share) return true;

  const allowedChildIds = getSharedChildIds(share);

  if (allowedChildIds.size === 0) return false;

  return allowedChildIds.has(String(childId || ""));
}

function filterDocumentsForShare(documents = [], share) {
  if (!share) return documents;

  return documents.filter((document) =>
    isChildAllowedForShare(share, document.childId)
  );
}

function filterPhotosForShare(photos = [], share) {
  if (!share) return photos;

  const allowedChildIds = getSharedChildIds(share);

  if (allowedChildIds.size === 0) return [];

  return photos.filter((photo) => {
    const photoChildIds = Array.isArray(photo.children) ? photo.children : [];
    return photoChildIds.some((childId) => allowedChildIds.has(String(childId || "")));
  });
}

function assertChildrenAllowedForShare(share, childIds = []) {
  if (!share) return;

  const cleanChildIds = Array.isArray(childIds) ? childIds : [];
  const hasForbiddenChild = cleanChildIds.some(
    (childId) => !isChildAllowedForShare(share, childId)
  );

  if (hasForbiddenChild) {
    const error = new Error("Votre compte invité ne peut pas associer ce fichier à cet enfant.");
    error.statusCode = 403;
    error.errorCode = "guest_child_forbidden";
    throw error;
  }
}


async function loadSharedChildrenForImportedShare(share) {
  if (!share?.sourceOwnerUserId) {
    return Array.isArray(share?.children) ? share.children : [];
  }

  const childIds = Array.from(getSharedChildIds(share));

  if (childIds.length === 0) {
    return Array.isArray(share?.children) ? share.children : [];
  }

  const children = await Promise.all(
    childIds.map(async (childId) => {
      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: `USER#${share.sourceOwnerUserId}`,
            SK: `CHILD#${childId}`,
          },
        })
      );

      const child = result.Item || null;

      if (!child) return null;

      return hydrateChildAvatarUrl(child, share.sourceOwnerUserId);
    })
  );

  const freshChildren = children.filter(Boolean);

  if (freshChildren.length > 0) {
    return freshChildren;
  }

  return Array.isArray(share.children) ? share.children : [];
}

async function hydrateChildAvatarUrl(child, ownerId) {
  if (!child?.avatarS3Key) {
    return child;
  }

  if (!isSafeS3KeyForOwner(child.avatarS3Key, ownerId)) {
    return {
      ...child,
      avatar: "",
      photo: "",
      image: "",
      avatarBlocked: true,
    };
  }

  try {
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: child.avatarS3Key,
      }),
      { expiresIn: 3600 }
    );

    return {
      ...child,
      avatar: downloadUrl,
      photo: downloadUrl,
      image: downloadUrl,
    };
  } catch (error) {
    console.error("Erreur génération URL avatar:", error);

    return {
      ...child,
      avatar: "",
      photo: "",
      image: "",
      avatarError: true,
    };
  }
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
  const profilePhotoPosition = body.profilePhotoPosition || body.avatarPosition || {
    x: 50,
    y: 50,
  };

  return {
    displayName: body.displayName || "",
    nickname: body.nickname || body.preferredNickname || "",
    familyRole: body.familyRole || body.userRole || "",
    profilePhoto: body.profilePhoto || body.avatar || "",
    profilePhotoS3Key: body.profilePhotoS3Key || body.avatarS3Key || "",
    profilePhotoPosition,
    profilePhotoZoom: Number(body.profilePhotoZoom || body.avatarZoom) || 1,
    phone: body.phone || "",
    preferredLanguage: body.preferredLanguage || "fr",
  };
}


function getProfileDisplayName(profile = {}, fallbackEmail = "") {
  return (
    profile.nickname ||
    profile.preferredNickname ||
    profile.displayName ||
    profile.name ||
    profile.given_name ||
    profile.givenName ||
    profile.fullName ||
    fallbackEmail ||
    ""
  );
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
  const fileName = body.fileName || "";
  const fileType = inferDocumentFileType(fileName, body.fileType);

  return {
    fileName,
    fileType,
    fileSize: Number(body.fileSize) || 0,
    childId: body.childId || "",
    childName: body.childName || "",
    category: body.category || body.type || "Document",
    folderId: body.folderId || body.folder || "other",
    folderName: body.folderName || "Autres documents",
    title: body.title || fileName || "Document",
    note: body.note || "",
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

async function hydrateProfilePhotoUrl(profile, ownerId) {
  if (!profile?.profilePhotoS3Key) {
    return profile;
  }

  if (!isSafeS3KeyForOwner(profile.profilePhotoS3Key, ownerId)) {
    return {
      ...profile,
      profilePhoto: "",
      profilePhotoBlocked: true,
    };
  }

  try {
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: S3_DOCUMENTS_BUCKET,
        Key: profile.profilePhotoS3Key,
      }),
      { expiresIn: 3600 }
    );

    return {
      ...profile,
      profilePhoto: downloadUrl,
    };
  } catch (error) {
    console.error("Erreur génération URL photo profil:", error);
    return profile;
  }
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

function normalizeShareCode(code = "") {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isValidShareCode(code = "") {
  return /^[A-Z0-9]{4}$/.test(normalizeShareCode(code));
}

function hashShareCode(code = "", salt = "") {
  return createHash("sha256")
    .update(`${String(salt)}:${normalizeShareCode(code)}`)
    .digest("hex");
}

function safeCompareHash(expectedHash = "", actualHash = "") {
  const expected = Buffer.from(String(expectedHash), "hex");
  const actual = Buffer.from(String(actualHash), "hex");

  if (expected.length !== actual.length || expected.length === 0) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

function getPublicAppUrl() {
  return String(APP_URL || "https://camelio.app").replace(/\/$/, "");
}

function isShareExpired(share) {
  if (!share?.expiresAt) return true;
  return new Date(share.expiresAt).getTime() <= Date.now();
}

function isShareActive(share) {
  return Boolean(share) && share.status !== "revoked" && !isShareExpired(share);
}

function getPublicDocumentSharePk(token = "") {
  return `PUBLIC_DOCUMENT_SHARE#${String(token || "").trim()}`;
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

app.get("/api/version", (req, res) => {
  res.json({
    success: true,
    version: "profile-sharing-token-import-2026-05-25",
    message:
      "Cette version utilise token + courriel connecté pour les invitations.",
  });
});

async function sendEmailWithResend({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY est manquant dans Render.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: EMAIL_REPLY_TO,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Erreur Resend:", {
      status: response.status,
      data,
    });

    throw new Error(
      data?.message ||
        data?.error?.message ||
        `Erreur Resend HTTP ${response.status}`
    );
  }

  return data;
}

app.get("/api/test-email", async (req, res) => {
  try {
    console.log("TEST RESEND EMAIL START", {
      hasResendApiKey: Boolean(RESEND_API_KEY),
      emailFrom: EMAIL_FROM,
      emailReplyTo: EMAIL_REPLY_TO,
    });

    const result = await sendEmailWithResend({
      to: process.env.TEST_EMAIL_TO || process.env.SMTP_USER || "info@camelio.app",
      subject: "Test courriel Camelio via Resend",
      html: `
        <div style="font-family: Arial, sans-serif; color: #4F4A45; line-height: 1.6;">
          <h2>Test Resend Camelio</h2>
          <p>Si tu reçois ce courriel, l’envoi via Resend fonctionne.</p>
        </div>
      `,
      text: "Si tu reçois ce courriel, l’envoi via Resend fonctionne.",
    });

    return res.json({
      success: true,
      message: "Courriel de test envoyé avec Resend.",
      result,
    });
  } catch (error) {
    console.error("Erreur test Resend:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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
    subscriptionsTable: process.env.SUBSCRIPTIONS_TABLE || null,
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

    await ensureSubscriptionPlaceholder(req);

    const result = await dynamo.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: userPk,
          SK: "PROFILE",
        },
      })
    );

    const existingProfile = result.Item || {};

    const existingUserId = existingProfile.userId
      ? String(existingProfile.userId).replace(/\D/g, "").slice(0, 7)
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
      ...existingProfile,
      PK: userPk,
      SK: "PROFILE",
      type: "profile",
      userId,
      cognitoSub: req.session.user.sub,
      email: existingProfile.email || req.session.user.email || "",
      name:
        existingProfile.name ||
        existingProfile.displayName ||
        req.session.user.name ||
        req.session.user.given_name ||
        "",
      displayName:
        existingProfile.displayName ||
        existingProfile.name ||
        req.session.user.name ||
        req.session.user.given_name ||
        "",
      nickname: existingProfile.nickname || existingProfile.preferredNickname || "",
      familyRole: existingProfile.familyRole || existingProfile.userRole || "",
      profilePhoto: existingProfile.profilePhoto || existingProfile.avatar || "",
      profilePhotoS3Key: existingProfile.profilePhotoS3Key || existingProfile.avatarS3Key || "",
      profilePhotoPosition:
        existingProfile.profilePhotoPosition || existingProfile.avatarPosition || {
          x: 50,
          y: 50,
        },
      profilePhotoZoom:
        existingProfile.profilePhotoZoom || existingProfile.avatarZoom || 1,
      phone: existingProfile.phone || "",
      preferredLanguage: existingProfile.preferredLanguage || "fr",
      welcomeCompleted: Boolean(
        existingProfile.welcomeCompleted ||
          existingProfile.onboarding?.userWelcomeCompleted
      ),
      onboardingCompleted: Boolean(existingProfile.onboardingCompleted),
      onboardingSkipped: Boolean(existingProfile.onboardingSkipped),
      onboardingCompletedAt: existingProfile.onboardingCompletedAt || null,
      onboarding: existingProfile.onboarding || {},
      createdAt: existingProfile.createdAt || now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: profile,
      })
    );

    const hydratedProfile = await hydrateProfilePhotoUrl(profile, req.session.user.sub);

    return res.json({
      success: true,
      profile: hydratedProfile,
    });
  } catch (error) {
    next(error);
  }
});
app.put("/api/profile", requireAuth, validateAwsConfig, async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const userPk = getUserPk(req);
    const cleanedProfile = cleanProfilePayload(req.body || {});

    await ensureSubscriptionPlaceholder(req);

    const existingResult = await dynamo.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          PK: userPk,
          SK: "PROFILE",
        },
      })
    );

    const existingProfile = existingResult.Item || {};

    const existingUserId = existingProfile.userId
      ? String(existingProfile.userId).replace(/\D/g, "").slice(0, 7)
      : "";

    const userId = /^\d{7}$/.test(existingUserId)
      ? existingUserId
      : await generateUniqueSevenDigitUserId();

    const hasOnboardingUpdate =
      Object.prototype.hasOwnProperty.call(req.body || {}, "onboardingCompleted") ||
      Object.prototype.hasOwnProperty.call(req.body || {}, "onboarding");

    const profile = {
      ...existingProfile,
      PK: userPk,
      SK: "PROFILE",
      type: "profile",
      userId,
      cognitoSub: req.session.user.sub,
      email: req.session.user.email || existingProfile.email || "",

      name:
        req.body?.name ||
        cleanedProfile.displayName ||
        existingProfile.name ||
        existingProfile.displayName ||
        "",

      displayName:
        cleanedProfile.displayName ||
        req.body?.name ||
        existingProfile.displayName ||
        existingProfile.name ||
        "",

      nickname: cleanedProfile.nickname || existingProfile.nickname || "",
      familyRole: cleanedProfile.familyRole || existingProfile.familyRole || "",
      profilePhoto: cleanedProfile.profilePhoto || existingProfile.profilePhoto || "",
      profilePhotoS3Key:
        cleanedProfile.profilePhotoS3Key || existingProfile.profilePhotoS3Key || "",
      profilePhotoPosition:
        cleanedProfile.profilePhotoPosition ||
        existingProfile.profilePhotoPosition || {
          x: 50,
          y: 50,
        },
      profilePhotoZoom:
        cleanedProfile.profilePhotoZoom || existingProfile.profilePhotoZoom || 1,
      phone: cleanedProfile.phone || existingProfile.phone || "",
      preferredLanguage:
        cleanedProfile.preferredLanguage ||
        existingProfile.preferredLanguage ||
        "fr",

      onboardingCompleted: hasOnboardingUpdate
        ? req.body?.onboardingCompleted === true
        : Boolean(existingProfile.onboardingCompleted),

      onboardingSkipped: hasOnboardingUpdate
        ? req.body?.onboardingSkipped === true
        : Boolean(existingProfile.onboardingSkipped),

      onboardingCompletedAt: hasOnboardingUpdate
        ? req.body?.onboardingCompletedAt || now
        : existingProfile.onboardingCompletedAt || null,

      onboarding: hasOnboardingUpdate
        ? { ...(existingProfile.onboarding || {}), ...(req.body?.onboarding || {}) }
        : existingProfile.onboarding || {},

      welcomeCompleted:
        req.body?.welcomeCompleted === true ||
        req.body?.onboarding?.userWelcomeCompleted === true ||
        Boolean(existingProfile.welcomeCompleted),

      createdAt: existingProfile.createdAt || now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: profile,
      })
    );

    const hydratedProfile = await hydrateProfilePhotoUrl(profile, req.session.user.sub);

    return res.json({
      success: true,
      profile: hydratedProfile,
    });
  } catch (error) {
    next(error);
  }
});
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPermissionLabel(permission) {
  if (permission === "delete") return "Modifier et supprimer";
  if (permission === "edit") return "Modifier";
  return "Lecture seule";
}

function formatInvitationSections(sectionIds = [], sectionPermissions = {}) {
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return "<li>Aucune section précisée</li>";
  }

  return sectionIds
    .map((sectionId) => {
      const permission = sectionPermissions[sectionId] || "read";

      return `<li>
        <strong>${escapeHtml(sectionId)}</strong> : ${escapeHtml(
        formatPermissionLabel(permission)
      )}
      </li>`;
    })
    .join("");
}

function createInvitationExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function isExpiredIsoDate(value) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() < Date.now();
}

function cleanProfileSharePayload(body = {}) {
  const inviteeEmail = String(body.inviteeEmail || "")
    .trim()
    .toLowerCase();

  const childIds = Array.isArray(body.childIds) ? body.childIds : [];
  const sectionIds = Array.isArray(body.sectionIds) ? body.sectionIds : [];

  const allowedPermissions = ["read", "edit", "delete"];

  const rawSectionPermissions =
    body.sectionPermissions && typeof body.sectionPermissions === "object"
      ? body.sectionPermissions
      : {};

  const sectionPermissions = sectionIds.reduce((accumulator, sectionId) => {
    const permission = rawSectionPermissions[sectionId];

    accumulator[sectionId] = allowedPermissions.includes(permission)
      ? permission
      : "read";

    return accumulator;
  }, {});

  const highestPermission = Object.values(sectionPermissions).includes("delete")
    ? "delete"
    : Object.values(sectionPermissions).includes("edit")
      ? "edit"
      : "read";

  const rawShareLabel = String(
    body.shareLabel || body.label || body.guestShareLabel || ""
  ).trim();

  return {
    shareLabel: rawShareLabel.slice(0, 80),
    inviteeName: String(body.inviteeName || "").trim(),
    inviteeEmail,
    childIds,
    children: Array.isArray(body.children) ? body.children : [],
    sectionIds,
    sectionPermissions,
    permission: highestPermission,
    note: String(body.note || "").trim(),
  };
}

function buildProfileShareInviteUrl(invitationToken) {
  const inviteLink = new URL("/invitation", APP_URL);
  inviteLink.searchParams.set("token", invitationToken);
  return inviteLink.toString();
}

function normalizeInviteeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function buildCamelioAccueilUrl() {
  return new URL("/accueil", APP_URL).toString();
}

function buildCamelioSignupUrl() {
  return new URL("/signup", APP_URL).toString();
}

async function findDynamoProfileByEmail(email) {
  const cleanEmail = normalizeInviteeEmail(email);
  if (!cleanEmail) return null;

  let lastEvaluatedKey;

  do {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: "#type = :type AND email = :email",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": "profile",
          ":email": cleanEmail,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const profile = (result.Items || [])[0];

    if (profile) {
      const userId = profile.cognitoSub || String(profile.PK || "").replace(/^USER#/, "");

      return {
        found: true,
        source: "dynamodb",
        userId,
        email: profile.email || cleanEmail,
        name: profile.displayName || profile.name || profile.email || cleanEmail,
        profile,
      };
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return null;
}

async function findCognitoUserByEmail(email) {
  const cleanEmail = normalizeInviteeEmail(email);

  if (!cleanEmail || !COGNITO_USER_POOL_ID) return null;

  const safeEmail = cleanEmail.replace(/"/g, '\\"');

  const result = await cognitoIdentityProvider.send(
    new ListUsersCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Filter: `email = "${safeEmail}"`,
      Limit: 1,
    })
  );

  const user = (result.Users || [])[0];

  if (!user) return null;

  const attributes = Object.fromEntries(
    (user.Attributes || []).map((attribute) => [attribute.Name, attribute.Value])
  );

  return {
    found: true,
    source: "cognito",
    userId: attributes.sub || user.Username,
    email: attributes.email || cleanEmail,
    name: attributes.name || attributes.given_name || attributes.email || cleanEmail,
    cognitoUsername: user.Username,
    userStatus: user.UserStatus,
  };
}

async function findCamelioUserByEmail(email) {
  const cleanEmail = normalizeInviteeEmail(email);
  if (!cleanEmail) return null;

  const profileMatch = await findDynamoProfileByEmail(cleanEmail);
  if (profileMatch) return profileMatch;

  const cognitoMatch = await findCognitoUserByEmail(cleanEmail);
  if (cognitoMatch) return cognitoMatch;

  return null;
}

function createTemporaryPassword() {
  return `Cam-${randomUUID().replace(/-/g, "").slice(0, 14)}aA1!`;
}

async function sendCreateAccountInvitationEmail({
  email,
  name = "",
  guestAccessCode = "",
  emailSubject = "Invitation à rejoindre Camelio",
  emailBody = "",
}) {
  const signupUrl = buildCamelioSignupUrl();
  const accueilUrl = buildCamelioAccueilUrl();
  const safeBody = String(
    emailBody ||
      `Bonjour${name ? ` ${name}` : ""},\n\nJe t’invite à créer ton compte Camelio pour que je puisse te partager certaines informations familiales dans un espace sécurisé.\n\nTon code invité est : ${guestAccessCode}\n\nUtilise ce code avec le courriel ${email} lors de ton inscription ou dans l’activation de ton espace invité.\n\nÀ bientôt!`
  );

  const formattedBody = safeBody
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");

  return sendEmailWithResend({
    to: email,
    subject: emailSubject || "Invitation à rejoindre Camelio",
    html: `
      <div style="font-family: Arial, sans-serif; color: #4F4A45; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
        <div style="background: #FFFDF8; border: 1px solid #EADFCF; border-radius: 24px; padding: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #8F9874; font-weight: bold;">Camelio</p>
          <h2 style="margin: 0 0 16px; color: #4F4A45;">Tu es invité à rejoindre Camelio 😊</h2>
          ${formattedBody}
          ${guestAccessCode ? `<p style="background:#F7F3FF; border:1px solid #D8CBE8; border-radius:16px; padding:12px;"><strong>Code invité :</strong> ${escapeHtml(guestAccessCode)}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(signupUrl)}" style="display: inline-block; background: #A8B193; color: white; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: bold;">Créer mon compte Camelio</a>
          </p>
          <p style="font-size: 12px; color: #8B8278;">Page d’accueil : ${escapeHtml(accueilUrl)}</p>
        </div>
      </div>
    `,
    text: `${safeBody}\n\nCréer mon compte : ${signupUrl}`,
  });
}

async function sendProfileShareConfirmationEmail(share) {
  const dashboardUrl = new URL("/", APP_URL).toString();
  const childrenNames = (share.children || [])
    .map((child) => child.name)
    .filter(Boolean)
    .join(", ");

  return sendEmailWithResend({
    to: share.inviteeEmail,
    subject: "Ton accès partagé Camelio est prêt",
    html: `
      <div style="font-family: Arial, sans-serif; color: #4F4A45; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
        <div style="background: #FFFDF8; border: 1px solid #EADFCF; border-radius: 24px; padding: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #8F9874; font-weight: bold;">Camelio</p>
          <h2 style="margin: 0 0 16px; color: #4F4A45;">Ton accès partagé est prêt 😊</h2>
          <p>${escapeHtml(share.ownerName || "Un utilisateur Camelio")} t’a donné accès à des informations partagées dans Camelio.</p>
          <p><strong>Enfant(s) partagé(s) :</strong><br />${escapeHtml(childrenNames || "Non précisé")}</p>
          <p>Connecte-toi avec l’adresse <strong>${escapeHtml(share.inviteeEmail)}</strong> pour voir ton espace partagé.</p>
          ${share.guestAccessCode ? `<p><strong>Code invité :</strong> ${escapeHtml(share.guestAccessCode)}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; background: #A8B193; color: white; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: bold;">Ouvrir Camelio</a>
          </p>
        </div>
      </div>
    `,
    text: `Ton accès partagé Camelio est prêt. Connecte-toi ici : ${dashboardUrl}`,
  });
}

async function createImportedProfileShareForUser({ share, targetUserId, connectedEmail = "" }) {
  if (!share || !targetUserId) return null;

  const now = new Date().toISOString();
  const importedShareId = randomUUID();

  const importedShare = {
    PK: `USER#${targetUserId}`,
    SK: `IMPORTED_SHARE#${importedShareId}`,
    id: importedShareId,
    type: "importedProfileShare",
    sourceShareId: share.id,
    sourceOwnerUserId: share.ownerUserId,
    sourceOwnerEmail: share.ownerEmail || "",
    sourceOwnerName: share.ownerName || "",
    shareLabel: share.shareLabel || share.label || share.guestAccessCode || "",
    customShareLabel: "",
    inviteeUserId: targetUserId,
    inviteeEmail: connectedEmail || share.inviteeEmail || "",
    children: share.children || [],
    childIds: share.childIds || [],
    sectionIds: share.sectionIds || [],
    sectionPermissions: share.sectionPermissions || {},
    permission: share.permission || "read",
    status: "accepted",
    importedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: importedShare,
    })
  );

  return importedShare;
}

async function generateUniqueGuestAccessCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `INV-${generators
      .random(8)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

    const result = await dynamo.send(
      new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression:
          "(#type = :profileShareType OR #type = :guestSignupType) AND guestAccessCode = :guestAccessCode",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":profileShareType": "profileShare",
          ":guestSignupType": "guestSignupInvitation",
          ":guestAccessCode": code,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return code;
    }
  }

  return `INV-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function normalizeGuestAccessCodeInput(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

function getGuestAccessCodeVariants(value = "") {
  const normalized = normalizeGuestAccessCodeInput(value);
  const compact = normalized.replace(/-/g, "");
  const variants = new Set([normalized]);

  if (compact) {
    variants.add(compact);

    if (compact.startsWith("INV") && compact.length > 3) {
      variants.add(`INV-${compact.slice(3)}`);
    }
  }

  return Array.from(variants).filter(Boolean);
}

async function scanGuestCodeItems({ type, variants, limit = 50 }) {
  if (!type || !Array.isArray(variants) || variants.length === 0) return [];

  const expressionValues = {
    ":type": type,
  };

  const codeConditions = variants.map((variant, index) => {
    const key = `:guestAccessCode${index}`;
    expressionValues[key] = variant;
    return `guestAccessCode = ${key}`;
  });

  const items = [];
  let lastEvaluatedKey;

  do {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: `#type = :type AND (${codeConditions.join(" OR ")})`,
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: expressionValues,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    items.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey && items.length < limit);

  return items;
}

async function findGuestSignupInvitationByCode(guestAccessCode) {
  const variants = getGuestAccessCodeVariants(guestAccessCode);

  if (variants.length === 0) return null;

  const invitations = await scanGuestCodeItems({
    type: "guestSignupInvitation",
    variants,
    limit: 25,
  });

  return invitations
    .filter((invitation) => invitation.status !== "revoked")
    .sort((a, b) =>
      String(b.createdAt || b.updatedAt || "").localeCompare(
        String(a.createdAt || a.updatedAt || "")
      )
    )[0] || invitations[0] || null;
}

async function findProfileShareByGuestAccessCode(guestAccessCode) {
  const variants = getGuestAccessCodeVariants(guestAccessCode);

  if (variants.length === 0) return null;

  const shares = await scanGuestCodeItems({
    type: "profileShare",
    variants,
    limit: 50,
  });

  const activeShares = shares
    .filter((share) => share.status !== "revoked")
    .sort((a, b) =>
      String(b.createdAt || b.updatedAt || "").localeCompare(
        String(a.createdAt || a.updatedAt || "")
      )
    );

  return activeShares[0] || shares[0] || null;
}

async function getImportedShareByIdForCurrentUser(req, importedShareId = "") {
  const id = String(importedShareId || "").trim();

  if (!id) return null;

  const result = await dynamo.send(
    new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: getUserPk(req),
        SK: `IMPORTED_SHARE#${id}`,
      },
    })
  );

  const share = result.Item || null;

  if (!(await isImportedShareStillActive(share))) {
    return null;
  }

  return share;
}

async function findProfileShareByToken(invitationToken) {
  const token = String(invitationToken || "").trim();

  if (!token) return null;

  let lastEvaluatedKey;

  do {
    const scanResult = await dynamo.send(
      new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: "#type = :type AND invitationToken = :invitationToken",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": "profileShare",
          ":invitationToken": token,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const share = (scanResult.Items || [])[0];

    if (share) {
      return share;
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return null;
}

function sanitizePublicInvitation(share) {
  if (!share) return null;

  return {
    id: share.id,
    inviteeEmail: share.inviteeEmail || "",
    inviteeName: share.inviteeName || "",
    ownerName: share.ownerName || "",
    children: share.children || [],
    sectionIds: share.sectionIds || [],
    sectionPermissions: share.sectionPermissions || {},
    permission: share.permission || "read",
    status: share.status || "pending",
    invitationExpiresAt: share.invitationExpiresAt || null,
    expiresAt: share.expiresAt || share.invitationExpiresAt || null,
  };
}

async function sendProfileShareInvitationEmail(share) {
  const inviteUrl =
    share.inviteUrl || buildProfileShareInviteUrl(share.invitationToken);

  const childrenNames = (share.children || [])
    .map((child) => child.name)
    .filter(Boolean)
    .join(", ");

  const sectionsHtml = formatInvitationSections(
    share.sectionIds,
    share.sectionPermissions
  );

  const noteHtml = share.note
    ? `
      <div style="margin: 20px 0; padding: 16px; background: #FFFDF8; border: 1px solid #EADFCF; border-radius: 18px;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #8F9874; font-weight: bold;">
          Message
        </p>
        <p style="margin: 0; white-space: pre-line;">${escapeHtml(share.note)}</p>
      </div>
    `
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #4F4A45; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
      <div style="background: #FFFDF8; border: 1px solid #EADFCF; border-radius: 24px; padding: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #8F9874; font-weight: bold;">
          Camelio
        </p>

        <h2 style="margin: 0 0 16px; color: #4F4A45;">
          Tu as reçu une invitation Camelio 😊
        </h2>

        <p>
          ${escapeHtml(
            share.ownerName || "Un utilisateur Camelio"
          )} souhaite te partager un accès à Camelio.
        </p>

        <p>
          <strong>Enfant(s) partagé(s) :</strong><br />
          ${escapeHtml(childrenNames || "Non précisé")}
        </p>

        <p>
          <strong>Sections accessibles :</strong>
        </p>

        <ul>
          ${sectionsHtml}
        </ul>

        ${noteHtml}

        <p>
          Clique sur le bouton ci-dessous pour accepter l’invitation :
        </p>
        ${share.guestAccessCode ? `<p><strong>Code invité :</strong> ${escapeHtml(share.guestAccessCode)}</p>` : ""}

        <p style="margin: 24px 0;">
          <a
            href="${escapeHtml(inviteUrl)}"
            style="
              display: inline-block;
              background: #A8B193;
              color: white;
              padding: 12px 18px;
              border-radius: 999px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Accepter l’invitation
          </a>
        </p>

        <p style="font-size: 12px; color: #8B8278;">
          Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br />
          ${escapeHtml(inviteUrl)}
        </p>
      </div>
    </div>
  `;

  return sendEmailWithResend({
    to: share.inviteeEmail,
    subject: "Tu as reçu une invitation Camelio 😊",
    html,
    text: `Tu as reçu une invitation Camelio. Clique ici pour accepter l’invitation : ${inviteUrl}`,
  });
}


app.get(
  "/api/profile-shares/users/search",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const email = String(req.query.email || "").trim().toLowerCase();

      if (!email || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          found: false,
          error: "invalid_email",
          message: "Courriel invalide.",
        });
      }

      const result = await dynamo.send(
        new ScanCommand({
          TableName: DYNAMODB_TABLE,
          FilterExpression:
            "(#type = :profileType OR #type = :userInviteType) AND email = :email",
          ExpressionAttributeNames: {
            "#type": "type",
          },
          ExpressionAttributeValues: {
            ":profileType": "profile",
            ":userInviteType": "userInvite",
            ":email": email,
          },
        })
      );

      const profile = (result.Items || []).find((item) => {
        return String(item.email || "").trim().toLowerCase() === email;
      });

      if (!profile) {
        return res.json({
          success: true,
          found: false,
          user: null,
          message: "Aucun compte Camelio trouvé avec ce courriel.",
        });
      }

      const userId =
        profile.cognitoSub ||
        profile.userId ||
        String(profile.PK || "").replace("USER#", "");

      const automaticName = getProfileDisplayName(profile, profile.email || email);

      return res.json({
        success: true,
        found: true,
        user: {
          userId,
          email: profile.email || email,
          name: automaticName,
          displayName: profile.displayName || profile.name || automaticName,
          nickname: profile.nickname || profile.preferredNickname || "",
          familyRole: profile.familyRole || profile.userRole || "",
          profilePhoto: profile.profilePhoto || profile.avatar || "",
          source: "profile",
        },
      });
    } catch (error) {
      console.error("Erreur recherche utilisateur partage:", error);

      return res.status(500).json({
        success: false,
        found: false,
        error: "user_search_failed",
        message: error?.message || "Erreur serveur.",
      });
    }
  }
);

app.post(
  "/api/profile-shares/users/invite-create-account",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const email = normalizeInviteeEmail(req.body?.email || "");
      const name = String(req.body?.name || "").trim();
      const shouldSend = req.body?.send === true;
      const providedCode = normalizeGuestAccessCodeInput(req.body?.guestAccessCode || "");
      const guestAccessCode = providedCode || (await generateUniqueGuestAccessCode());
      const emailSubject = String(req.body?.emailSubject || "Invitation à rejoindre Camelio").trim();
      const emailBody = String(
        req.body?.emailBody ||
          `Bonjour${name ? ` ${name}` : ""},

Je t’invite à créer ton compte Camelio pour que je puisse te partager certaines informations familiales dans un espace sécurisé.

Ton code invité est : ${guestAccessCode}

Utilise ce code avec le courriel ${email} lors de ton inscription ou dans l’activation de ton espace invité.

À bientôt!`
      );

      if (!email || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "invalid_email",
          message: "Le courriel est invalide.",
        });
      }

      let existingUser = null;

      try {
        existingUser = await findCamelioUserByEmail(email);
      } catch (lookupError) {
        console.warn(
          "Recherche utilisateur ignorée pendant la préparation de l’invitation:",
          lookupError?.message || lookupError
        );
      }

      if (existingUser) {
        return res.json({
          success: true,
          alreadyExists: true,
          user: existingUser,
          message: "Un compte existe déjà avec ce courriel.",
        });
      }

      const now = new Date().toISOString();
      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: {
            PK: getUserPk(req),
            SK: `GUEST_SIGNUP_CODE#${guestAccessCode}`,
            type: "guestSignupInvitation",
            ownerUserId: req.session.user.sub,
            ownerEmail: req.session.user.email || "",
            ownerName:
              req.session.user.name ||
              req.session.user.given_name ||
              req.session.user.email ||
              "",
            inviteeEmail: email,
            inviteeName: name,
            guestAccessCode,
            guestAccessCodeEmail: email,
            status: shouldSend ? "sent" : "draft",
            emailSubject,
            emailBody,
            createdAt: now,
            updatedAt: now,
          },
        })
      );

      if (shouldSend) {
        await sendCreateAccountInvitationEmail({
          email,
          name,
          guestAccessCode,
          emailSubject,
          emailBody,
        });
      }

      return res.json({
        success: true,
        sent: shouldSend,
        guestAccessCode,
        emailSubject,
        emailBody,
        message: shouldSend
          ? "Invitation à créer un compte envoyée par courriel."
          : "Invitation préparée.",
      });
    } catch (error) {
      console.error("Erreur préparation invitation création compte:", error);
      return res.status(500).json({
        success: false,
        error: "invite_create_account_failed",
        message:
          error?.message ||
          "Impossible de préparer l’invitation. Vérifiez la configuration DynamoDB ou courriel.",
      });
    }
  }
);

app.post(
  "/api/profile-shares/users/create-cognito",
  requireAuth,
  validateAwsConfig,
  validateCognitoAdminConfig,
  async (req, res, next) => {
    try {
      const email = normalizeInviteeEmail(req.body?.email || "");
      const name = String(req.body?.name || "").trim();

      if (!email || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "invalid_email",
          message: "Le courriel est invalide.",
        });
      }

      let existingUser = null;

      try {
        existingUser = await findCamelioUserByEmail(email);
      } catch (lookupError) {
        console.warn(
          "Recherche utilisateur ignorée pendant la préparation de l’invitation:",
          lookupError?.message || lookupError
        );
      }

      if (existingUser) {
        return res.json({
          success: true,
          alreadyExists: true,
          user: existingUser,
          message: "Un compte existe déjà avec ce courriel.",
        });
      }

      try {
        await cognitoIdentityProvider.send(
          new AdminCreateUserCommand({
            UserPoolId: COGNITO_USER_POOL_ID,
            Username: email,
            UserAttributes: [
              { Name: "email", Value: email },
              ...(name ? [{ Name: "name", Value: name }] : []),
            ],
            DesiredDeliveryMediums: ["EMAIL"],
            TemporaryPassword: createTemporaryPassword(),
          })
        );
      } catch (error) {
        if (error?.name !== "UsernameExistsException") {
          throw error;
        }
      }

      const createdUser = await findCamelioUserByEmail(email);

      return res.json({
        success: true,
        user: createdUser,
        message:
          "Compte créé dans Cognito. La personne doit compléter son accès avec le courriel reçu.",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/profile-shares",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": getUserPk(req),
            ":sk": "SHARE#",
          },
        })
      );

      const shares = (result.Items || [])
        .filter((share) => share.status !== "revoked")
        .sort((a, b) => {
          return String(b.createdAt || "").localeCompare(
            String(a.createdAt || "")
          );
        });

      res.json({
        success: true,
        shares,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/profile-shares",
  requireAuth,
  validateAwsConfig,
  async (req, res) => {
    let share = null;

    try {
      const payload = cleanProfileSharePayload(req.body || {});

      if (!payload.inviteeEmail || !payload.inviteeEmail.includes("@")) {
        return res.status(400).json({
          error: "invalid_email",
          message: "Le courriel d’invitation est invalide.",
        });
      }

      if (payload.childIds.length === 0) {
        return res.status(400).json({
          error: "missing_children",
          message: "Sélectionnez au moins un enfant à partager.",
        });
      }

      if (payload.sectionIds.length === 0) {
        return res.status(400).json({
          error: "missing_sections",
          message: "Sélectionnez au moins une section à partager.",
        });
      }

      const now = new Date().toISOString();
      const shareId = req.body.id || randomUUID();
      const invitationToken = randomUUID();
      const providedGuestAccessCode = normalizeGuestAccessCodeInput(req.body?.guestAccessCode || "");
      const guestAccessCode = providedGuestAccessCode || (await generateUniqueGuestAccessCode());
      const shareLabel = payload.shareLabel || guestAccessCode;
      const shouldSkipInvitationEmail = req.body?.skipInvitationEmail === true || req.body?.inviteEmailAlreadySent === true;
      const invitationExpiresAt = createInvitationExpiry();
      const inviteUrl = buildProfileShareInviteUrl(invitationToken);

      share = {
        PK: getUserPk(req),
        SK: `SHARE#${shareId}`,
        id: shareId,
        type: "profileShare",
        ownerUserId: req.session.user.sub,
        ownerEmail: req.session.user.email || "",
        ownerName:
          req.session.user.name ||
          req.session.user.given_name ||
          req.session.user.email ||
          "",
        ...payload,
        shareLabel,
        label: shareLabel,
        status: "pending",
        invitationToken,
        guestAccessCode,
        guestAccessCodeEmail: payload.inviteeEmail,
        invitationExpiresAt,
        expiresAt: invitationExpiresAt,
        inviteUrl,
        importedByUserId: "",
        importedByEmail: "",
        importedAt: null,
        emailStatus: shouldSkipInvitationEmail ? "sent" : "pending",
        emailError: "",
        createAccountInvitationAlreadySent: shouldSkipInvitationEmail,
        createdAt: now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: share,
        })
      );

      const targetUserId = String(req.body?.targetUserId || req.body?.inviteeUserId || "").trim();

      if (targetUserId) {
        const importedShare = await createImportedProfileShareForUser({
          share,
          targetUserId,
          connectedEmail: share.inviteeEmail,
        });

        share = {
          ...share,
          status: "accepted",
          importedByUserId: targetUserId,
          importedByEmail: share.inviteeEmail,
          importedAt: new Date().toISOString(),
          emailStatus: "pending",
          updatedAt: new Date().toISOString(),
        };

        await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: share.PK,
              SK: share.SK,
            },
            UpdateExpression:
              "SET #status = :status, importedByUserId = :importedByUserId, importedByEmail = :importedByEmail, importedAt = :importedAt, emailStatus = :emailStatus, updatedAt = :updatedAt",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":status": share.status,
              ":importedByUserId": share.importedByUserId,
              ":importedByEmail": share.importedByEmail,
              ":importedAt": share.importedAt,
              ":emailStatus": share.emailStatus,
              ":updatedAt": share.updatedAt,
            },
            ReturnValues: "NONE",
          })
        );

        try {
          await sendProfileShareConfirmationEmail(share);
          share = { ...share, emailStatus: "sent", emailError: "", updatedAt: new Date().toISOString() };
          await dynamo.send(
            new UpdateCommand({
              TableName: DYNAMODB_TABLE,
              Key: { PK: share.PK, SK: share.SK },
              UpdateExpression: "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
              ExpressionAttributeValues: {
                ":emailStatus": share.emailStatus,
                ":emailError": share.emailError,
                ":updatedAt": share.updatedAt,
              },
              ReturnValues: "NONE",
            })
          );
        } catch (emailError) {
          share = { ...share, emailStatus: "failed", emailError: emailError?.message || "Erreur d’envoi courriel.", updatedAt: new Date().toISOString() };
        }

        return res.status(201).json({
          success: true,
          share,
          importedShare,
          message: "L’accès partagé a été créé pour l’utilisateur sélectionné.",
        });
      }

      if (shouldSkipInvitationEmail) {
        return res.status(201).json({
          success: true,
          share,
          message: "L’accès partagé a été créé. Aucun deuxième courriel n’a été envoyé, car l’invitation de création de compte a déjà été transmise.",
        });
      }

      try {
        await sendProfileShareInvitationEmail(share);

        share = {
          ...share,
          emailStatus: "sent",
          emailError: "",
          updatedAt: new Date().toISOString(),
        };

        await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: share.PK,
              SK: share.SK,
            },
            UpdateExpression:
              "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":emailStatus": share.emailStatus,
              ":emailError": share.emailError,
              ":updatedAt": share.updatedAt,
            },
            ReturnValues: "NONE",
          })
        );

        return res.status(201).json({
          success: true,
          share,
          message: "L’invitation a été créée et envoyée par courriel.",
        });
      } catch (emailError) {
        console.error("Erreur envoi courriel invitation Camelio:", emailError);

        share = {
          ...share,
          emailStatus: "failed",
          emailError: emailError?.message || "Erreur d’envoi courriel.",
          updatedAt: new Date().toISOString(),
        };

        await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: share.PK,
              SK: share.SK,
            },
            UpdateExpression:
              "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":emailStatus": share.emailStatus,
              ":emailError": share.emailError,
              ":updatedAt": share.updatedAt,
            },
            ReturnValues: "NONE",
          })
        );

        return res.status(201).json({
          success: true,
          share,
          message:
            "L’invitation a été créée, mais le courriel n’a pas pu être envoyé.",
        });
      }
    } catch (error) {
      console.error("Erreur création invitation Camelio:", error);

      return res.json({
  success: true,
  found: false,
  user: null,
  message: "Aucun compte Camelio trouvé avec ce courriel.",
});
    }
  }
);

app.put(
  "/api/profile-shares/:shareId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { shareId } = req.params;
      const payload = cleanProfileSharePayload(req.body || {});

      if (!payload.inviteeEmail || !payload.inviteeEmail.includes("@")) {
        return res.status(400).json({
          error: "invalid_email",
          message: "Le courriel d’invitation est invalide.",
        });
      }

      if (payload.childIds.length === 0) {
        return res.status(400).json({
          error: "missing_children",
          message: "Sélectionnez au moins un enfant à partager.",
        });
      }

      if (payload.sectionIds.length === 0) {
        return res.status(400).json({
          error: "missing_sections",
          message: "Sélectionnez au moins une section à partager.",
        });
      }

      const now = new Date().toISOString();

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `SHARE#${shareId}`,
          },
          UpdateExpression:
            "SET shareLabel = :shareLabel, #label = :shareLabel, inviteeName = :inviteeName, inviteeEmail = :inviteeEmail, childIds = :childIds, children = :children, sectionIds = :sectionIds, sectionPermissions = :sectionPermissions, permission = :permission, note = :note, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#label": "label",
          },
          ExpressionAttributeValues: {
            ":shareLabel": payload.shareLabel || req.body?.guestAccessCode || shareId,
            ":inviteeName": payload.inviteeName,
            ":inviteeEmail": payload.inviteeEmail,
            ":childIds": payload.childIds,
            ":children": payload.children,
            ":sectionIds": payload.sectionIds,
            ":sectionPermissions": payload.sectionPermissions,
            ":permission": payload.permission,
            ":note": payload.note,
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      return res.json({
        success: true,
        share: result.Attributes,
        message: "L’accès a été modifié.",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/profile-shares/:shareId/resend",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { shareId } = req.params;

      const existingResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `SHARE#${shareId}`,
          },
        })
      );

      const existingShare = existingResult.Item;

      if (!existingShare || existingShare.status === "revoked") {
        return res.status(404).json({
          success: false,
          error: "share_not_found",
          message: "Cet accès partagé est introuvable ou révoqué.",
        });
      }

      try {
        await sendProfileShareInvitationEmail(existingShare);

        const result = await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: getUserPk(req),
              SK: `SHARE#${shareId}`,
            },
            UpdateExpression:
              "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":emailStatus": "sent",
              ":emailError": "",
              ":updatedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
          })
        );

        return res.json({
          success: true,
          share: result.Attributes,
          message: "Invitation renvoyée par courriel.",
        });
      } catch (emailError) {
        const result = await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: getUserPk(req),
              SK: `SHARE#${shareId}`,
            },
            UpdateExpression:
              "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":emailStatus": "failed",
              ":emailError": emailError?.message || "Erreur d’envoi courriel.",
              ":updatedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
          })
        );

        return res.status(502).json({
          success: false,
          share: result.Attributes,
          message: "Le courriel n’a pas pu être renvoyé.",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/profile-shares/:shareId/regenerate-link",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { shareId } = req.params;
      const now = new Date().toISOString();
      const invitationToken = randomUUID();
      const guestAccessCode = await generateUniqueGuestAccessCode();
      const invitationExpiresAt = createInvitationExpiry();
      const inviteUrl = buildProfileShareInviteUrl(invitationToken);

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `SHARE#${shareId}`,
          },
          UpdateExpression:
            "SET invitationToken = :invitationToken, invitationExpiresAt = :invitationExpiresAt, expiresAt = :expiresAt, inviteUrl = :inviteUrl, #status = :status, importedByUserId = :empty, importedByEmail = :empty, importedAt = :nullValue, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":invitationToken": invitationToken,
            ":invitationExpiresAt": invitationExpiresAt,
            ":expiresAt": invitationExpiresAt,
            ":inviteUrl": inviteUrl,
            ":status": "pending",
            ":empty": "",
            ":nullValue": null,
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      let updatedShare = result.Attributes;

      try {
        await sendProfileShareInvitationEmail(updatedShare);

        const emailStatusResult = await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: getUserPk(req),
              SK: `SHARE#${shareId}`,
            },
            UpdateExpression:
              "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":emailStatus": "sent",
              ":emailError": "",
              ":updatedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
          })
        );

        updatedShare = emailStatusResult.Attributes;
      } catch (emailError) {
        const emailStatusResult = await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: getUserPk(req),
              SK: `SHARE#${shareId}`,
            },
            UpdateExpression:
              "SET emailStatus = :emailStatus, emailError = :emailError, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":emailStatus": "failed",
              ":emailError": emailError?.message || "Erreur d’envoi courriel.",
              ":updatedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
          })
        );

        updatedShare = emailStatusResult.Attributes;
      }

      return res.json({
        success: true,
        share: updatedShare,
        message: "Un nouveau lien sécurisé a été généré.",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/profile-shares/invitation/:token",
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const token = String(req.params.token || "").trim();

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "missing_token",
          message: "Le lien d’invitation est incomplet.",
        });
      }

      const share = await findProfileShareByToken(token);

      if (!share) {
        return res.status(404).json({
          success: false,
          error: "invitation_not_found",
          message: "Cette invitation est introuvable.",
        });
      }

      if (share.status === "revoked") {
        return res.status(403).json({
          success: false,
          error: "invitation_revoked",
          message: "Cette invitation a été révoquée.",
        });
      }

      if (share.status === "accepted") {
        return res.status(409).json({
          success: false,
          error: "invitation_already_accepted",
          message: "Cette invitation a déjà été acceptée.",
        });
      }

      if (isExpiredIsoDate(share.invitationExpiresAt)) {
        return res.status(410).json({
          success: false,
          error: "invitation_expired",
          message: "Cette invitation est expirée. Demandez un nouveau lien.",
        });
      }

      return res.json({
        success: true,
        invitation: sanitizePublicInvitation(share),
      });
    } catch (error) {
      next(error);
    }
  }
);
app.patch(
  "/api/profile-shares/:shareId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { shareId } = req.params;
      const payload = cleanProfileSharePayload(req.body || {});
      const now = new Date().toISOString();

      if (!shareId) {
        return res.status(400).json({
          success: false,
          error: "missing_share_id",
          message: "Identifiant du partage manquant.",
        });
      }

      if (!payload.inviteeEmail || !payload.inviteeEmail.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "invalid_email",
          message: "Le courriel d’invitation est invalide.",
        });
      }

      if (!Array.isArray(payload.childIds) || payload.childIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "missing_children",
          message: "Sélectionnez au moins un enfant à partager.",
        });
      }

      if (!Array.isArray(payload.sectionIds) || payload.sectionIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "missing_sections",
          message: "Sélectionnez au moins une section à partager.",
        });
      }

      const existingResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `SHARE#${shareId}`,
          },
        })
      );

      const existingShare = existingResult.Item;

      if (!existingShare || existingShare.status === "revoked") {
        return res.status(404).json({
          success: false,
          error: "share_not_found",
          message: "Ce partage est introuvable.",
        });
      }

      const updateResult = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `SHARE#${shareId}`,
          },
          UpdateExpression:
            "SET inviteeName = :inviteeName, inviteeEmail = :inviteeEmail, childIds = :childIds, children = :children, sectionIds = :sectionIds, sectionPermissions = :sectionPermissions, #permission = :permission, note = :note, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#permission": "permission",
          },
          ExpressionAttributeValues: {
            ":inviteeName": payload.inviteeName || "",
            ":inviteeEmail": payload.inviteeEmail,
            ":childIds": payload.childIds,
            ":children": payload.children,
            ":sectionIds": payload.sectionIds,
            ":sectionPermissions": payload.sectionPermissions,
            ":permission": payload.permission || "read",
            ":note": payload.note || "",
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      const updatedShare = updateResult.Attributes;

      if (existingShare.importedByUserId) {
        const importedResult = await dynamo.send(
          new QueryCommand({
            TableName: DYNAMODB_TABLE,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            FilterExpression: "sourceShareId = :sourceShareId",
            ExpressionAttributeValues: {
              ":pk": `USER#${existingShare.importedByUserId}`,
              ":sk": "IMPORTED_SHARE#",
              ":sourceShareId": shareId,
            },
          })
        );

        const importedShares = importedResult.Items || [];

        await Promise.all(
          importedShares.map((importedShare) =>
            dynamo.send(
              new UpdateCommand({
                TableName: DYNAMODB_TABLE,
                Key: {
                  PK: importedShare.PK,
                  SK: importedShare.SK,
                },
                UpdateExpression:
                  "SET childIds = :childIds, children = :children, sectionIds = :sectionIds, sectionPermissions = :sectionPermissions, #permission = :permission, note = :note, updatedAt = :updatedAt",
                ExpressionAttributeNames: {
                  "#permission": "permission",
                },
                ExpressionAttributeValues: {
                  ":childIds": payload.childIds,
                  ":children": payload.children,
                  ":sectionIds": payload.sectionIds,
                  ":sectionPermissions": payload.sectionPermissions,
                  ":permission": payload.permission || "read",
                  ":note": payload.note || "",
                  ":updatedAt": now,
                },
              })
            )
          )
        );
      }

      return res.json({
        success: true,
        share: updatedShare,
        message: "Le partage a été modifié.",
      });
    } catch (error) {
      console.error("Erreur modification partage:", error);

      return res.status(500).json({
        success: false,
        error: "share_update_failed",
        message:
          error?.message ||
          "Impossible de modifier le partage pour le moment.",
      });
    }
  }
);
app.patch(
  "/api/profile-shares/:shareId/revoke",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const { shareId } = req.params;
      const now = new Date().toISOString();

      if (!shareId) {
        return res.status(400).json({
          success: false,
          error: "missing_share_id",
          message: "Identifiant du partage manquant.",
        });
      }

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: `SHARE#${shareId}`,
          },
          UpdateExpression:
            "SET #status = :status, revokedAt = :revokedAt, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "revoked",
            ":revokedAt": now,
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      const revokedShare = result.Attributes;

      if (revokedShare?.importedByUserId) {
        const importedResult = await dynamo.send(
          new QueryCommand({
            TableName: DYNAMODB_TABLE,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            FilterExpression: "sourceShareId = :sourceShareId",
            ExpressionAttributeValues: {
              ":pk": `USER#${revokedShare.importedByUserId}`,
              ":sk": "IMPORTED_SHARE#",
              ":sourceShareId": shareId,
            },
          })
        );

        await Promise.all(
          (importedResult.Items || []).map((importedShare) =>
            revokeImportedShareLocally(importedShare, "owner_revoked")
          )
        );
      }

      return res.json({
        success: true,
        share: revokedShare,
        message: "L’accès partagé a été révoqué.",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/profile-shares/import",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const token = String(req.body?.token || req.body?.invitationToken || "")
        .trim();

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "missing_token",
          message: "Le token d’invitation est requis.",
        });
      }

      const share = await findProfileShareByToken(token);

      if (!share) {
        return res.status(404).json({
          success: false,
          error: "invitation_not_found",
          message: "Cette invitation est introuvable.",
        });
      }

      if (share.status === "revoked") {
        return res.status(403).json({
          success: false,
          error: "invitation_revoked",
          message: "Cette invitation a été révoquée.",
        });
      }

      if (share.status === "accepted") {
        return res.status(409).json({
          success: false,
          error: "invitation_already_accepted",
          message: "Cette invitation a déjà été acceptée.",
        });
      }

      if (isExpiredIsoDate(share.invitationExpiresAt)) {
        return res.status(410).json({
          success: false,
          error: "invitation_expired",
          message: "Cette invitation est expirée. Demandez un nouveau lien.",
        });
      }

      const connectedEmail = String(req.session.user?.email || "")
        .trim()
        .toLowerCase();

      const invitedEmail = String(share.inviteeEmail || "")
        .trim()
        .toLowerCase();

      if (!connectedEmail || connectedEmail !== invitedEmail) {
        return res.status(403).json({
          success: false,
          error: "email_mismatch",
          message:
            "Cette invitation est associée à une autre adresse courriel. Connectez-vous avec l’adresse invitée.",
        });
      }

      if (share.ownerUserId === req.session.user.sub) {
        return res.status(400).json({
          success: false,
          error: "cannot_import_own_share",
          message: "Vous ne pouvez pas importer votre propre partage.",
        });
      }

      const now = new Date().toISOString();
      const importedShareId = randomUUID();

      const importedShare = {
        PK: getUserPk(req),
        SK: `IMPORTED_SHARE#${importedShareId}`,
        id: importedShareId,
        type: "importedProfileShare",

        sourceShareId: share.id,
        sourceOwnerUserId: share.ownerUserId,
        sourceOwnerEmail: share.ownerEmail || "",
        sourceOwnerName: share.ownerName || "",
        shareLabel: share.shareLabel || share.label || share.guestAccessCode || "",
        customShareLabel: "",

        inviteeUserId: req.session.user.sub,
        inviteeEmail: connectedEmail,

        children: share.children || [],
        childIds: share.childIds || [],
        sectionIds: share.sectionIds || [],
        sectionPermissions: share.sectionPermissions || {},
        permission: share.permission || "read",

        status: "accepted",
        importedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: importedShare,
        })
      );

      const updatedSourceResult = await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: share.PK,
            SK: share.SK,
          },
          UpdateExpression:
            "SET #status = :status, importedByUserId = :importedByUserId, importedByEmail = :importedByEmail, importedAt = :importedAt, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "accepted",
            ":importedByUserId": req.session.user.sub,
            ":importedByEmail": connectedEmail,
            ":importedAt": now,
            ":updatedAt": now,
          },
          ReturnValues: "ALL_NEW",
        })
      );

      return res.json({
        success: true,
        message: "L’accès partagé a été importé avec succès.",
        share: importedShare,
        sourceShare: updatedSourceResult.Attributes,
      });
    } catch (error) {
      next(error);
    }
  }
);


app.post(
  "/api/profile-shares/redeem-code",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const code = normalizeGuestAccessCodeInput(req.body?.code || "");
      const connectedEmail = String(req.session.user?.email || "").trim().toLowerCase();

      if (!code) {
        return res.status(400).json({
          success: false,
          error: "missing_code",
          message: "Inscrivez un code invité.",
        });
      }

      const share = await findProfileShareByGuestAccessCode(code);

      if (!share) {
        const signupInvitation = await findGuestSignupInvitationByCode(code);

        if (signupInvitation) {
          return res.status(409).json({
            success: false,
            error: "access_not_configured",
            message:
              "Ce code existe, mais les accès partagés ne sont pas encore configurés. Demandez à la personne qui vous a invité de compléter l’étape Accès dans Partage de profil.",
          });
        }

        return res.status(404).json({
          success: false,
          error: "code_not_found",
          message: "Ce code invité est introuvable ou n’est plus valide.",
        });
      }

      if (share.status === "revoked") {
        return res.status(404).json({
          success: false,
          error: "code_revoked",
          message: "Cette invitation a été révoquée.",
        });
      }

      const invitedEmail = String(share.inviteeEmail || share.guestAccessCodeEmail || "")
        .trim()
        .toLowerCase();

      if (!connectedEmail || connectedEmail !== invitedEmail) {
        return res.status(403).json({
          success: false,
          error: "email_mismatch",
          message:
            invitedEmail
              ? `Ce code invité est associé au courriel ${invitedEmail}. Connectez-vous avec ce courriel pour l’utiliser.`
              : "Ce code invité est associé à une autre adresse courriel.",
        });
      }

      if (share.ownerUserId === req.session.user.sub) {
        return res.status(400).json({
          success: false,
          error: "cannot_import_own_share",
          message: "Vous ne pouvez pas utiliser votre propre code invité.",
        });
      }

      if (isExpiredIsoDate(share.invitationExpiresAt)) {
        return res.status(410).json({
          success: false,
          error: "code_expired",
          message: "Ce code invité est expiré. Demandez un nouveau code.",
        });
      }

      const userPk = getUserPk(req);
      const existingImports = await dynamo.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": userPk,
            ":sk": "IMPORTED_SHARE#",
          },
        })
      );

      const alreadyImported = (existingImports.Items || []).find(
        (item) => item.sourceShareId === share.id && item.status !== "revoked"
      );

      if (alreadyImported) {
        const now = new Date().toISOString();
        const importedGuestAccountId = alreadyImported?.id
          ? `guest-${alreadyImported.id}`
          : "";

        await ensureSubscriptionPlaceholder(req);

        await dynamo.send(
          new PutCommand({
            TableName: SUBSCRIPTIONS_TABLE,
            Item: {
              PK: getUserPk(req),
              SK: "SUBSCRIPTION",
              type: "subscription",
              userId: req.session.user.sub,
              email: connectedEmail,
              status: "guest",
              plan: null,
              accountType: "guest",
              subscriptionRequired: false,
              source: "guest_invitation_code",
              guestAccessCode: code,
              linkedOwnerAccountId: share.ownerUserId || share.sourceOwnerUserId || "",
              linkedOwnerEmail: share.ownerEmail || share.sourceOwnerEmail || "",
              linkedOwnerName: share.ownerName || share.sourceOwnerName || "",
              importedShareId: alreadyImported?.id || "",
              sourceShareId: share.id || alreadyImported.sourceShareId || "",
              storageGb: 0,
              stripeCustomerId: "",
              stripeSubscriptionId: "",
              stripeCheckoutSessionId: "",
              trialEnd: null,
              trialEndsAt: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
              activatedAt: now,
              createdAt: now,
              updatedAt: now,
            },
          })
        );

        if (importedGuestAccountId) {
          await dynamo.send(
            new UpdateCommand({
              TableName: DYNAMODB_TABLE,
              Key: {
                PK: userPk,
                SK: "PROFILE",
              },
              UpdateExpression:
                "SET activeAccountId = :activeAccountId, welcomeCompleted = :welcomeCompleted, updatedAt = :updatedAt",
              ExpressionAttributeValues: {
                ":activeAccountId": importedGuestAccountId,
                ":welcomeCompleted": true,
                ":updatedAt": now,
              },
              ReturnValues: "NONE",
            })
          );
        }

        return res.json({
          success: true,
          message: "Ce code invité est maintenant associé à votre compte partagé.",
          accountType: "guest",
          status: "guest",
          hasAccess: true,
          reloadAccounts: true,
          activeAccountId: importedGuestAccountId,
          importedShareId: alreadyImported?.id || "",
          share: alreadyImported,
        });
      }

      const importedShare = await createImportedProfileShareForUser({
        share,
        targetUserId: req.session.user.sub,
        connectedEmail,
      });

      const now = new Date().toISOString();
      const importedGuestAccountId = importedShare?.id
        ? `guest-${importedShare.id}`
        : "";

      await ensureSubscriptionPlaceholder(req);

      await dynamo.send(
        new PutCommand({
          TableName: SUBSCRIPTIONS_TABLE,
          Item: {
            PK: getUserPk(req),
            SK: "SUBSCRIPTION",
            type: "subscription",
            userId: req.session.user.sub,
            email: connectedEmail,
            status: "guest",
            plan: null,
            accountType: "guest",
            subscriptionRequired: false,
            source: "guest_invitation_code",
            guestAccessCode: code,
            linkedOwnerAccountId: share.ownerUserId || share.sourceOwnerUserId || "",
            linkedOwnerEmail: share.ownerEmail || share.sourceOwnerEmail || "",
            linkedOwnerName: share.ownerName || share.sourceOwnerName || "",
            importedShareId: importedShare?.id || "",
            sourceShareId: share.id || "",
            storageGb: 0,
            stripeCustomerId: "",
            stripeSubscriptionId: "",
            stripeCheckoutSessionId: "",
            trialEnd: null,
            trialEndsAt: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            activatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        })
      );

      if (importedGuestAccountId) {
        await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: userPk,
              SK: "PROFILE",
            },
            UpdateExpression:
              "SET activeAccountId = :activeAccountId, welcomeCompleted = :welcomeCompleted, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":activeAccountId": importedGuestAccountId,
              ":welcomeCompleted": true,
              ":updatedAt": now,
            },
            ReturnValues: "NONE",
          })
        );
      }

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: { PK: share.PK, SK: share.SK },
          UpdateExpression:
            "SET #status = :status, importedByUserId = :importedByUserId, importedByEmail = :importedByEmail, importedAt = :importedAt, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "accepted",
            ":importedByUserId": req.session.user.sub,
            ":importedByEmail": connectedEmail,
            ":importedAt": now,
            ":updatedAt": now,
          },
          ReturnValues: "NONE",
        })
      );

      return res.json({
        success: true,
        message: "Votre accès invité a été associé à votre compte partagé.",
        accountType: "guest",
        status: "guest",
        hasAccess: true,
        reloadAccounts: true,
        activeAccountId: importedGuestAccountId,
        importedShareId: importedShare?.id || "",
        share: importedShare,
      });
    } catch (error) {
      next(error);
    }
  }
);



app.get(
  "/api/accounts",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const userPk = getUserPk(req);
      const now = new Date().toISOString();

      const [profileResult, subscriptionResult, importedSharesResult] =
        await Promise.all([
          dynamo.send(
            new GetCommand({
              TableName: DYNAMODB_TABLE,
              Key: {
                PK: userPk,
                SK: "PROFILE",
              },
            })
          ),
          dynamo.send(
            new GetCommand({
              TableName: SUBSCRIPTIONS_TABLE,
              Key: {
                PK: userPk,
                SK: "SUBSCRIPTION",
              },
            })
          ),
          dynamo.send(
            new QueryCommand({
              TableName: DYNAMODB_TABLE,
              KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
              ExpressionAttributeValues: {
                ":pk": userPk,
                ":sk": "IMPORTED_SHARE#",
              },
            })
          ),
        ]);

      const profile = profileResult.Item || {};
      const subscription = subscriptionResult.Item || null;
      const activeStatuses = ["trialing", "active"];
      const hasPrincipalAccess = Boolean(
        subscription && activeStatuses.includes(subscription.status)
      );

      const principalAccount = {
        accountId: `principal-${req.session.user.sub}`,
        label: "Compte principal",
        description: "Vos données personnelles",
        type: "principal",
        role: "owner",
        subscriptionRequired: true,
        hasAccess: hasPrincipalAccess,
        subscriptionStatus: subscription?.status || "none",
        plan: subscription?.plan || null,
        storageGb: Number(subscription?.storageGb) || Number(STRIPE_STORAGE_GB) || 5,
      };

      const activeGuestShares = [];

      for (const share of importedSharesResult.Items || []) {
        if (await isImportedShareStillActive(share)) {
          activeGuestShares.push(share);
        }
      }

      const guestShares = activeGuestShares.sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

      const guestAccounts = await Promise.all(
        guestShares.map(async (share, index) => {
          const sharedChildren = await loadSharedChildrenForImportedShare(share);
          const hydratedShare = {
            ...share,
            customSharePhoto: share.customSharePhoto || share.sharePhoto || share.profilePhoto || "",
            customSharePhotoS3Key: share.customSharePhotoS3Key || "",
            children: sharedChildren,
          };

          const guestLabel =
            share.customShareLabel ||
            share.shareLabel ||
            share.label ||
            share.guestAccessCode ||
            (share.sourceOwnerName ? `Invité de ${share.sourceOwnerName}` : "Invité (partagé)");

          const guestPhoto =
            share.customSharePhoto ||
            share.sharePhoto ||
            share.profilePhoto ||
            "";

          return {
            accountId: `guest-${share.id || index}`,
            label: guestLabel,
            description: share.sourceOwnerName
              ? `Partagé par ${share.sourceOwnerName}`
              : share.sourceOwnerEmail
                ? `Partagé par ${share.sourceOwnerEmail}`
                : "Accès limité et partagé",
            type: "guest",
            role: "guest",
            subscriptionRequired: false,
            hasAccess: true,
            subscriptionStatus: "not_required",
            shareId: share.id,
            shareLabel: share.shareLabel || share.label || "",
            customShareLabel: share.customShareLabel || "",
            customSharePhoto: guestPhoto,
            customSharePhotoS3Key: share.customSharePhotoS3Key || "",
            guestAccessCode: share.guestAccessCode || "",
            sourceShareId: share.sourceShareId || "",
            sourceOwnerUserId: share.sourceOwnerUserId || "",
            sourceOwnerEmail: share.sourceOwnerEmail || "",
            sourceOwnerName: share.sourceOwnerName || "",
            children: sharedChildren,
            childIds: share.childIds || [],
            sectionIds: share.sectionIds || [],
            sectionPermissions: share.sectionPermissions || {},
            permission: share.permission || "read",
            share: hydratedShare,
          };
        })
      );

      const accounts = [principalAccount, ...guestAccounts];
      const savedActiveAccountId = String(profile.activeAccountId || "");
      const savedAccountExists = accounts.some(
        (account) => account.accountId === savedActiveAccountId
      );

      const subscriptionGuestAccount =
        subscription?.status === "guest"
          ? guestAccounts.find(
              (account) =>
                account.shareId &&
                String(account.shareId) === String(subscription.importedShareId || "")
            ) || guestAccounts[0]
          : null;

      const defaultActiveAccountId = savedAccountExists
        ? savedActiveAccountId
        : subscriptionGuestAccount
        ? subscriptionGuestAccount.accountId
        : guestAccounts[0]?.accountId || principalAccount.accountId;

      if ((subscriptionGuestAccount || !savedAccountExists) && profile.PK && profile.SK) {
        try {
          await dynamo.send(
            new UpdateCommand({
              TableName: DYNAMODB_TABLE,
              Key: {
                PK: userPk,
                SK: "PROFILE",
              },
              UpdateExpression:
                "SET activeAccountId = :activeAccountId, updatedAt = :updatedAt",
              ExpressionAttributeValues: {
                ":activeAccountId": defaultActiveAccountId,
                ":updatedAt": now,
              },
              ReturnValues: "NONE",
            })
          );
        } catch (updateError) {
          console.warn("Impossible de sauvegarder le compte actif par défaut:", updateError?.message || updateError);
        }
      }

      return res.json({
        success: true,
        accounts,
        activeAccountId: defaultActiveAccountId,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.put(
  "/api/accounts/active",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const requestedAccountId = String(req.body?.accountId || "").trim();

      if (!requestedAccountId) {
        return res.status(400).json({
          success: false,
          error: "missing_account_id",
          message: "Le compte actif est requis.",
        });
      }

      const userPk = getUserPk(req);
      const now = new Date().toISOString();

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: "PROFILE",
          },
          UpdateExpression:
            "SET activeAccountId = :activeAccountId, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":activeAccountId": requestedAccountId,
            ":updatedAt": now,
          },
          ReturnValues: "NONE",
        })
      );

      return res.json({
        success: true,
        activeAccountId: requestedAccountId,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/profile-shares/imported",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": getUserPk(req),
            ":sk": "IMPORTED_SHARE#",
          },
        })
      );

      const importedShares = (result.Items || []).filter(
        (share) => share.status !== "revoked"
      );

      return res.json({
        success: true,
        hasSharedAccess: importedShares.length > 0,
        shares: importedShares,
      });
    } catch (error) {
      next(error);
    }
  }
);


app.patch(
  "/api/profile-shares/imported/:shareId/label",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const shareId = String(req.params.shareId || "").trim();
      const label = String(req.body?.label || req.body?.shareLabel || "")
        .trim()
        .slice(0, 80);
      const customSharePhoto = String(req.body?.customSharePhoto || "")
        .trim()
        .slice(0, 2048);
      const customSharePhotoS3Key = String(req.body?.customSharePhotoS3Key || "")
        .trim()
        .slice(0, 1024);

      if (!shareId) {
        return res.status(400).json({
          success: false,
          error: "missing_share_id",
          message: "L’accès invité est introuvable.",
        });
      }

      if (!label) {
        return res.status(400).json({
          success: false,
          error: "missing_label",
          message: "Inscrivez un nom pour ce partage.",
        });
      }

      const userPk = getUserPk(req);
      const now = new Date().toISOString();

      const existingResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: `IMPORTED_SHARE#${shareId}`,
          },
        })
      );

      if (!existingResult.Item || existingResult.Item.status === "revoked") {
        return res.status(404).json({
          success: false,
          error: "guest_access_not_found",
          message: "Cet accès invité est introuvable ou a été retiré.",
        });
      }

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: `IMPORTED_SHARE#${shareId}`,
          },
          UpdateExpression:
            "SET customShareLabel = :label, customSharePhoto = :customSharePhoto, customSharePhotoS3Key = :customSharePhotoS3Key, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":label": label,
            ":customSharePhoto": customSharePhoto,
            ":customSharePhotoS3Key": customSharePhotoS3Key,
            ":updatedAt": now,
          },
          ReturnValues: "NONE",
        })
      );

      return res.json({
        success: true,
        share: {
          ...existingResult.Item,
          customShareLabel: label,
          customSharePhoto,
          customSharePhotoS3Key,
          updatedAt: now,
        },
        message: "Le partage a été modifié.",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/profile-shares/imported/:shareId",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const shareId = String(req.params.shareId || "").trim();
      const confirmation = String(req.body?.confirmation || "")
        .trim()
        .toLowerCase();

      if (!shareId) {
        return res.status(400).json({
          success: false,
          error: "missing_share_id",
          message: "L’accès invité est introuvable.",
        });
      }

      if (confirmation !== "retirer") {
        return res.status(400).json({
          success: false,
          error: "invalid_confirmation",
          message: "Veuillez inscrire le mot retirer pour confirmer.",
        });
      }

      const userPk = getUserPk(req);
      const now = new Date().toISOString();

      const existingResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: `IMPORTED_SHARE#${shareId}`,
          },
        })
      );

      if (!existingResult.Item || existingResult.Item.status === "revoked") {
        return res.status(404).json({
          success: false,
          error: "guest_access_not_found",
          message: "Cet accès invité est déjà retiré ou introuvable.",
        });
      }

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: `IMPORTED_SHARE#${shareId}`,
          },
          UpdateExpression:
            "SET #status = :status, removedAt = :removedAt, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "revoked",
            ":removedAt": now,
            ":updatedAt": now,
          },
          ReturnValues: "NONE",
        })
      );

      const principalAccountId = `principal-${req.session.user.sub}`;

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: userPk,
            SK: "PROFILE",
          },
          UpdateExpression:
            "SET activeAccountId = :activeAccountId, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":activeAccountId": principalAccountId,
            ":updatedAt": now,
          },
          ReturnValues: "NONE",
        })
      );

      return res.json({
        success: true,
        message: "Votre accès invité a été retiré.",
        activeAccountId: principalAccountId,
        redirectUrl: "/",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/children",
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
            ":sk": "CHILD#",
          },
        })
      );

      const ownerId = getOwnerId(req);

      const childrenWithFreshAvatars = await Promise.all(
        (result.Items || []).map((child) =>
          hydrateChildAvatarUrl(child, ownerId)
        )
      );

      const children = childrenWithFreshAvatars.sort((a, b) => {
        return String(a.createdAt || "").localeCompare(
          String(b.createdAt || "")
        );
      });

      res.json({
        children,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
      const now = new Date().toISOString();

      await ensureSubscriptionPlaceholder(req);

      const result = await dynamo.send(
        new GetCommand({
          TableName: SUBSCRIPTIONS_TABLE,
          Key: {
            PK: getUserPk(req),
            SK: "SUBSCRIPTION",
          },
        })
      );

      const subscription = result.Item || null;
      const activeStatuses = ["trialing", "active"];

      if (subscription?.status === "guest") {
        const activeImportedShare =
          (await getActiveImportedShare(req)) ||
          (await getImportedShareByIdForCurrentUser(req, subscription.importedShareId));

        if (activeImportedShare) {
          return res.json({
            hasAccess: true,
            status: "guest",
            plan: null,
            accountType: "guest",
            subscriptionRequired: false,
            source: subscription.source || "guest_invitation_code",
            linkedOwnerAccountId: subscription.linkedOwnerAccountId || activeImportedShare.sourceOwnerUserId || "",
            linkedOwnerEmail: subscription.linkedOwnerEmail || activeImportedShare.sourceOwnerEmail || "",
            linkedOwnerName: subscription.linkedOwnerName || activeImportedShare.sourceOwnerName || "",
            importedShareId: subscription.importedShareId || activeImportedShare.id || "",
            sourceShareId: subscription.sourceShareId || activeImportedShare.sourceShareId || "",
            subscription,
          });
        }

        return res.json({
          hasAccess: false,
          status: "guest_revoked",
          plan: null,
          accountType: "guest",
          subscriptionRequired: false,
          message: "Votre accès invité n’est plus actif.",
          subscription,
        });
      }

      if (subscription && activeStatuses.includes(subscription.status)) {
        return res.json({
          hasAccess: true,
          status: subscription.status,
          plan: subscription.plan || null,
          source: subscription.source || "dynamodb",
          stripeCustomerId: subscription.stripeCustomerId || null,
          stripeSubscriptionId: subscription.stripeSubscriptionId || null,
          currentPeriodEnd: subscription.currentPeriodEnd || null,
          trialEnd: subscription.trialEnd || null,
          trialEndsAt: subscription.trialEndsAt || subscription.trialEnd || null,
          cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
          subscription,
        });
      }

      if (!stripe || !req.session.user?.email) {
        return res.json({
          hasAccess: false,
          status: subscription?.status || "none",
          plan: subscription?.plan || null,
          currentPeriodEnd: subscription?.currentPeriodEnd || null,
          trialEnd: subscription?.trialEnd || null,
          trialEndsAt: subscription?.trialEndsAt || subscription?.trialEnd || null,
          cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
          subscription,
        });
      }

      const customers = await stripe.customers.list({
        email: req.session.user.email,
        limit: 10,
      });

      let activeStripeSubscription = null;
      let stripeCustomerId = "";

      for (const customer of customers.data || []) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 10,
        });

        activeStripeSubscription = (subscriptions.data || []).find((item) =>
          activeStatuses.includes(item.status)
        );

        if (activeStripeSubscription) {
          stripeCustomerId = customer.id;
          break;
        }
      }

      if (!activeStripeSubscription) {
        return res.json({
          hasAccess: false,
          status: subscription?.status || "none",
          plan: subscription?.plan || null,
          currentPeriodEnd: subscription?.currentPeriodEnd || null,
          trialEnd: subscription?.trialEnd || null,
          trialEndsAt: subscription?.trialEndsAt || subscription?.trialEnd || null,
          cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
          subscription,
        });
      }

      const trialEnd = activeStripeSubscription.trial_end
        ? new Date(activeStripeSubscription.trial_end * 1000).toISOString()
        : null;

      const currentPeriodEnd = activeStripeSubscription.current_period_end
        ? new Date(activeStripeSubscription.current_period_end * 1000).toISOString()
        : null;

      const syncedSubscription = {
        PK: getUserPk(req),
        SK: "SUBSCRIPTION",
        type: "subscription",
        userId: req.session.user.sub,
        email: req.session.user.email || "",
        status: activeStripeSubscription.status,
        plan:
          activeStripeSubscription.metadata?.plan ||
          subscription?.plan ||
          STRIPE_PRICE_LOOKUP_KEY,
        storageGb:
          Number(activeStripeSubscription.metadata?.storageGb) ||
          Number(subscription?.storageGb) ||
          Number(STRIPE_STORAGE_GB) ||
          5,
        source: "stripe_sync",
        stripeCustomerId,
        stripeSubscriptionId: activeStripeSubscription.id,
        stripeCheckoutSessionId: subscription?.stripeCheckoutSessionId || "",
        trialEnd,
        trialEndsAt: trialEnd,
        currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(activeStripeSubscription.cancel_at_period_end),
        createdAt: subscription?.createdAt || now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: SUBSCRIPTIONS_TABLE,
          Item: syncedSubscription,
        })
      );

      return res.json({
        hasAccess: true,
        status: syncedSubscription.status,
        plan: syncedSubscription.plan,
        source: "stripe_sync",
        stripeCustomerId: syncedSubscription.stripeCustomerId,
        stripeSubscriptionId: syncedSubscription.stripeSubscriptionId,
        currentPeriodEnd: syncedSubscription.currentPeriodEnd,
        trialEnd: syncedSubscription.trialEnd,
        trialEndsAt: syncedSubscription.trialEndsAt,
        cancelAtPeriodEnd: syncedSubscription.cancelAtPeriodEnd,
        subscription: syncedSubscription,
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
          TableName: SUBSCRIPTIONS_TABLE,
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
          TableName: SUBSCRIPTIONS_TABLE,
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

app.post(
  "/api/subscription/activate-code",
  requireAuth,
  validateStripeConfig,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const submittedCode = String(req.body?.code || "")
        .trim()
        .toUpperCase();

      const validCodes = String(process.env.FREE_ACCESS_CODES || "")
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean);

      if (!submittedCode) {
        return res.status(400).json({
          error: "missing_code",
          message: "Le code d’accès est requis.",
        });
      }

      if (!validCodes.includes(submittedCode)) {
        return res.status(403).json({
          error: "invalid_code",
          message: "Ce code d’accès n’est pas valide.",
        });
      }

      await ensureSubscriptionPlaceholder(req);

      const now = new Date().toISOString();
      const promoPlan = CAMELIO_PLANS.famille_plus;

      const codeOwners = {
  CAMELIOBETA: "Beta",
  PROMOALEX: "Alex",
  PROMOEMMANUEL: "Emmanuel",
  PROMOMELANIE: "Mélanie",
};

      const codeOwner = codeOwners[submittedCode] || "Non défini";
      let stripeCustomerId = "";

      if (stripe) {
  try {
    const existingSubscriptionResult = await dynamo.send(
      new GetCommand({
        TableName: SUBSCRIPTIONS_TABLE,
        Key: {
          PK: getUserPk(req),
          SK: "SUBSCRIPTION",
        },
      })
    );

    const existingSubscription = existingSubscriptionResult.Item || null;

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;

      await stripe.customers.update(stripeCustomerId, {
        email: req.session.user.email || undefined,
        name: req.session.user.name || undefined,
        metadata: {
          userId: req.session.user.sub,
          userEmail: req.session.user.email || "",
          source: "Camelio",
          plan: promoPlan.id,
          planLabel: promoPlan.label,
          lookupKey: promoPlan.lookupKey,
          access_code: submittedCode,
          access_code_owner: codeOwner,
          activated_at: now,
        },
      });
    } else {
      const customer = await stripe.customers.create({
        email: req.session.user.email || undefined,
        name: req.session.user.name || undefined,
        metadata: {
          userId: req.session.user.sub,
          userEmail: req.session.user.email || "",
          source: "Camelio",
          plan: promoPlan.id,
          planLabel: promoPlan.label,
          lookupKey: promoPlan.lookupKey,
          access_code: submittedCode,
          access_code_owner: codeOwner,
          activated_at: now,
        },
      });

      stripeCustomerId = customer.id;
    }
  } catch (stripeError) {
    console.error(
      "Erreur création ou mise à jour client Stripe pour code gratuit:",
      stripeError
    );
  }
}

      const subscriptionItem = {
        PK: getUserPk(req),
        SK: "SUBSCRIPTION",
        type: "subscription",
        userId: req.session.user.sub,
        email: req.session.user.email || "",
        status: "active",
        plan: promoPlan.id,
        planLabel: promoPlan.label,
        storageGb: promoPlan.storageGb,
        guestLimit: promoPlan.guestLimit,
        accountType: "principal",
        subscriptionRequired: false,
        source: "promo_code",
        accessCode: submittedCode,
        accessCodeOwner: codeOwner,
        stripeCustomerId,
        stripeSubscriptionId: "",
        stripeCheckoutSessionId: "",
        trialEnd: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        activatedAt: now,
        updatedAt: now,
        createdAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: SUBSCRIPTIONS_TABLE,
          Item: subscriptionItem,
        })
      );

      return res.json({
        success: true,
        hasAccess: true,
        status: "active",
        plan: subscriptionItem.plan,
        storageGb: subscriptionItem.storageGb,
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
      const payload = cleanDocumentPayload(req.body || {});

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

      const accessContext = await getDataAccessContext(req, "documents", "edit");

      if (accessContext.isGuest && !isChildAllowedForShare(accessContext.share, payload.childId)) {
        return res.status(403).json({
          error: "guest_child_forbidden",
          message: "Votre compte invité ne peut pas ajouter un document pour cet enfant.",
        });
      }

      const ownerId = accessContext.ownerId;
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
  PK: accessContext.dataPk,
  SK: `DOCUMENT#${documentId}`,
  id: documentId,
  type: "document",
  ownerId,
  createdByUserId: req.session.user.sub,
  createdFromAccountType: accessContext.isGuest ? "guest" : "principal",
  childId: payload.childId,
  childName: payload.childName,
  category: payload.category,
  folderId: payload.folderId || "other",
  folderName: payload.folderName || "Autres documents",
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
    const accessContext = await getDataAccessContext(req, "documents", "read");

    const result = await dynamo.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": accessContext.dataPk,
          ":sk": "DOCUMENT#",
        },
      })
    );

    const visibleDocuments = filterDocumentsForShare(result.Items || [], accessContext.share);

    const documents = visibleDocuments.sort((a, b) => {
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
      const accessContext = await getDataAccessContext(req, "documents", "read");

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: accessContext.dataPk,
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

      if (accessContext.isGuest && !isChildAllowedForShare(accessContext.share, document.childId)) {
        return res.status(403).json({
          error: "guest_child_forbidden",
          message: "Accès refusé à ce document.",
        });
      }

      const ownerId = accessContext.ownerId;

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
      const accessContext = await getDataAccessContext(req, "documents", "delete");

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: accessContext.dataPk,
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

      if (accessContext.isGuest && !isChildAllowedForShare(accessContext.share, document.childId)) {
        return res.status(403).json({
          error: "guest_child_forbidden",
          message: "Accès refusé à ce document.",
        });
      }

      const ownerId = accessContext.ownerId;

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
            PK: accessContext.dataPk,
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
  "/api/documents/:documentId/share-link",
  requireAuth,
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const code = normalizeShareCode(req.body?.code);
      const durationDays = Number(req.body?.durationDays);
      const accessMode = "view_only";

      if (!isValidShareCode(code)) {
        return res.status(400).json({
          error: "invalid_code",
          message: "Le code doit contenir exactement 4 caractères, lettres ou chiffres.",
        });
      }

      if (![1, 3, 7].includes(durationDays)) {
        return res.status(400).json({
          error: "invalid_duration",
          message: "La durée doit être de 1 journée, 3 jours ou 7 jours.",
        });
      }

      const accessContext = await getDataAccessContext(req, "documents", "edit");

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: accessContext.dataPk,
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

      if (accessContext.isGuest && !isChildAllowedForShare(accessContext.share, document.childId)) {
        return res.status(403).json({
          error: "guest_child_forbidden",
          message: "Accès refusé à ce document.",
        });
      }

      if (!isSafeS3KeyForOwner(document.s3Key, accessContext.ownerId)) {
        return res.status(403).json({
          error: "forbidden_s3_key",
          message: "Accès refusé à ce document.",
        });
      }

      const token = randomUUID().replace(/-/g, "");
      const salt = randomUUID();
      const now = new Date();
      const expiresAtDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const expiresAt = expiresAtDate.toISOString();
      const shareUrl = `${getPublicAppUrl()}/shared-document/${token}`;

      const shareItem = {
        PK: getPublicDocumentSharePk(token),
        SK: "METADATA",
        type: "public_document_share",
        token,
        status: "active",
        ownerId: accessContext.ownerId,
        dataPk: accessContext.dataPk,
        createdByUserId: req.session.user.sub,
        createdByEmail: req.session.user.email || "",
        documentId: document.id || documentId,
        documentName: document.title || document.fileName || "Document Camelio",
        fileName: document.fileName || "",
        fileType: document.fileType || "",
        fileSize: document.fileSize || 0,
        childId: document.childId || "",
        childName: document.childName || "",
        s3Key: document.s3Key,
        codeSalt: salt,
        codeHash: hashShareCode(code, salt),
        durationDays,
        accessMode,
        allowDownload: false,
        shareUrl,
        accessCount: 0,
        failedAttempts: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt,
        expiresAtEpoch: Math.floor(expiresAtDate.getTime() / 1000),
      };

      await dynamo.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: shareItem,
          ConditionExpression: "attribute_not_exists(PK)",
        })
      );

      return res.json({
        success: true,
        token,
        shareUrl,
        url: shareUrl,
        expiresAt,
        durationDays,
        accessMode,
        allowDownload: false,
        message: `Lien sécurisé créé en mode visionnement seulement. Il sera actif pendant ${durationDays === 1 ? "1 journée" : `${durationDays} jours`}.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/shared-documents/:token",
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const token = String(req.params.token || "").trim();

      if (!token) {
        return res.status(400).json({
          error: "missing_token",
          message: "Lien invalide.",
        });
      }

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getPublicDocumentSharePk(token),
            SK: "METADATA",
          },
        })
      );

      const share = result.Item;

      if (!isShareActive(share)) {
        return res.status(404).json({
          error: "link_unavailable",
          message: "Ce lien est invalide, expiré ou désactivé.",
        });
      }

      return res.json({
        success: true,
        token,
        documentName: share.documentName || share.fileName || "Document Camelio",
        fileName: share.fileName || "",
        fileType: share.fileType || "",
        fileSize: share.fileSize || 0,
        childName: share.childName || "",
        expiresAt: share.expiresAt,
        accessMode: share.accessMode || "view_only",
        allowDownload: false,
        requiresCode: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/shared-documents/:token/access",
  validateAwsConfig,
  validateS3Config,
  async (req, res, next) => {
    try {
      const token = String(req.params.token || "").trim();
      const code = normalizeShareCode(req.body?.code);

      if (!token || !isValidShareCode(code)) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Lien ou code invalide.",
        });
      }

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getPublicDocumentSharePk(token),
            SK: "METADATA",
          },
        })
      );

      const share = result.Item;

      if (!isShareActive(share)) {
        return res.status(404).json({
          error: "link_unavailable",
          message: "Ce lien est invalide, expiré ou désactivé.",
        });
      }

      const submittedHash = hashShareCode(code, share.codeSalt || "");

      if (!safeCompareHash(share.codeHash || "", submittedHash)) {
        await dynamo.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              PK: getPublicDocumentSharePk(token),
              SK: "METADATA",
            },
            UpdateExpression:
              "SET failedAttempts = if_not_exists(failedAttempts, :zero) + :one, lastFailedAttemptAt = :now, updatedAt = :now",
            ExpressionAttributeValues: {
              ":zero": 0,
              ":one": 1,
              ":now": new Date().toISOString(),
            },
          })
        );

        return res.status(403).json({
          error: "invalid_code",
          message: "Code d’accès invalide.",
        });
      }

      const documentResult = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: share.dataPk,
            SK: `DOCUMENT#${share.documentId}`,
          },
        })
      );

      const document = documentResult.Item;

      if (!document || document.s3Key !== share.s3Key) {
        return res.status(404).json({
          error: "document_unavailable",
          message: "Ce document n’est plus disponible.",
        });
      }

      if (!isSafeS3KeyForOwner(document.s3Key, share.ownerId)) {
        return res.status(403).json({
          error: "forbidden_s3_key",
          message: "Accès refusé à ce document.",
        });
      }

      const viewUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: S3_DOCUMENTS_BUCKET,
          Key: document.s3Key,
        }),
        { expiresIn: 300 }
      );

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getPublicDocumentSharePk(token),
            SK: "METADATA",
          },
          UpdateExpression:
            "SET accessCount = if_not_exists(accessCount, :zero) + :one, lastAccessedAt = :now, updatedAt = :now",
          ExpressionAttributeValues: {
            ":zero": 0,
            ":one": 1,
            ":now": new Date().toISOString(),
          },
        })
      );

      return res.json({
        success: true,
        viewUrl,
        url: viewUrl,
        expiresIn: 300,
        accessMode: share.accessMode || "view_only",
        allowDownload: false,
        documentName: share.documentName || share.fileName || "Document Camelio",
        fileName: share.fileName || "",
        fileType: share.fileType || "",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/shared-documents/:token",
  requireAuth,
  validateAwsConfig,
  async (req, res, next) => {
    try {
      const token = String(req.params.token || "").trim();

      if (!token) {
        return res.status(400).json({
          error: "missing_token",
          message: "Lien invalide.",
        });
      }

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getPublicDocumentSharePk(token),
            SK: "METADATA",
          },
        })
      );

      const share = result.Item;

      if (!share) {
        return res.status(404).json({
          error: "not_found",
          message: "Lien introuvable.",
        });
      }

      const currentUserId = req.session.user.sub;
      const canRevoke =
        share.ownerId === currentUserId || share.createdByUserId === currentUserId;

      if (!canRevoke) {
        return res.status(403).json({
          error: "forbidden",
          message: "Vous ne pouvez pas désactiver ce lien.",
        });
      }

      const now = new Date().toISOString();

      await dynamo.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: getPublicDocumentSharePk(token),
            SK: "METADATA",
          },
          UpdateExpression:
            "SET #status = :status, revokedAt = :revokedAt, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "revoked",
            ":revokedAt": now,
            ":updatedAt": now,
          },
        })
      );

      return res.json({
        success: true,
        token,
        revokedAt: now,
        message: "Lien sécurisé désactivé.",
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

      const accessContext = await getDataAccessContext(req, "photos", "edit");
      const ownerId = accessContext.ownerId;
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

    const accessContext = await getDataAccessContext(req, "photos", "edit");
    assertChildrenAllowedForShare(accessContext.share, children);

    const ownerId = accessContext.ownerId;

    if (!isSafeS3KeyForOwner(s3Key, ownerId)) {
      return res.status(403).json({
        error: "forbidden_s3_key",
        message: "Clé S3 non autorisée pour cet utilisateur.",
      });
    }

    const now = new Date().toISOString();

    const photo = {
      PK: accessContext.dataPk,
      SK: `PHOTO#${id}`,
      id,
      type: "photo",
      ownerId,
      createdByUserId: req.session.user.sub,
      createdFromAccountType: accessContext.isGuest ? "guest" : "principal",
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
      const accessContext = await getDataAccessContext(req, "photos", "read");

      const result = await dynamo.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": accessContext.dataPk,
            ":sk": "PHOTO#",
          },
        })
      );

      const ownerId = accessContext.ownerId;
      const visiblePhotos = filterPhotosForShare(result.Items || [], accessContext.share);

      const photos = await Promise.all(
        visiblePhotos.map(async (photo) => {
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
      const accessContext = await getDataAccessContext(req, "photos", "delete");

      const result = await dynamo.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: accessContext.dataPk,
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

      assertChildrenAllowedForShare(accessContext.share, photo.children || []);

      const ownerId = accessContext.ownerId;

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
            PK: accessContext.dataPk,
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
  async (req, res) => {
    try {
      await ensureSubscriptionPlaceholder(req);

      const selectedPlan = getCamelioPlan(req.body?.plan || req.body?.lookup_key);
      const lookupKey = selectedPlan.lookupKey || STRIPE_PRICE_LOOKUP_KEY;

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
          plan: selectedPlan.id,
          planLabel: selectedPlan.label,
          lookupKey,
          storageGb: String(selectedPlan.storageGb),
          guestLimit: String(selectedPlan.guestLimit),
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
          plan: selectedPlan.id,
          planLabel: selectedPlan.label,
          lookupKey,
          storageGb: String(selectedPlan.storageGb),
          guestLimit: String(selectedPlan.guestLimit),
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
          TableName: SUBSCRIPTIONS_TABLE,
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
          message: "Compte supprimé.",
        });
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================
   Diagnostics
   ========================= */

app.use((err, req, res, next) => {
  console.error("ERREUR SERVEUR:", err);

  const statusCode = Number(err.statusCode) || 500;

  return res.status(statusCode).json({
    error: err.errorCode || (statusCode === 500 ? "server_error" : "request_error"),
    message: statusCode === 500 && IS_PRODUCTION ? "Erreur serveur." : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Camelio server lancé sur http://localhost:${PORT}`);
});
