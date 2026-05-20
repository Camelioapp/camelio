const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ca-central-1",
});

router.post("/presign-test", async (req, res) => {
  try {
    const { fileName, fileType, childId } = req.body;

    if (!fileName || !fileType || !childId) {
      return res.status(400).json({
        error: "missing_fields",
        message: "fileName, fileType et childId sont requis.",
      });
    }

    const ownerId = "demo-user";
    const documentId = uuidv4();

    const cleanFileName = fileName
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const s3Key = `users/${ownerId}/children/${childId}/documents/${documentId}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_DOCUMENTS_BUCKET,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    res.json({
      uploadUrl,
      s3Key,
    });
  } catch (error) {
    console.error("Erreur S3 test:", error);

    res.status(500).json({
      error: "server_error",
      message: "Impossible de générer l’URL S3.",
    });
  }
});

module.exports = router;