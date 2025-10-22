import { S3Client } from "@aws-sdk/client-s3";

let s3Client = null;
let initialized = false;

// Initialize S3 client based on storage provider
function initializeS3Client() {
  if (!initialized) {
    const storageProvider = process.env.STORAGE_PROVIDER || "aws-s3";

    if (storageProvider === "cloudflare-r2") {
      // Cloudflare R2 Configuration
      s3Client = new S3Client({
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
        region: "auto",
      });
      console.log("Using Cloudflare R2 for file storage");
    } else {
      // AWS S3 Configuration
      s3Client = new S3Client({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_REGION,
      });
      console.log("Using AWS S3 for file storage");
    }
    initialized = true;
  }

  return s3Client;
}

export default initializeS3Client;
