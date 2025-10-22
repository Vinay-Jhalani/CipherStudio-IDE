import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import initializeS3Client from "../config/aws.js";

// Get bucket name based on storage provider
const getBucketName = () => {
  const provider = process.env.STORAGE_PROVIDER || "aws-s3";
  return provider === "cloudflare-r2"
    ? process.env.R2_BUCKET_NAME
    : process.env.S3_BUCKET_NAME;
};

// Helper function to convert stream to string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

// Upload file to S3/R2
export const uploadToS3 = async (fileContent, key, contentType) => {
  const s3Client = initializeS3Client();

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  try {
    const result = await s3Client.send(command);
    return result;
  } catch (error) {
    throw new Error(`Storage Upload Error: ${error.message}`);
  }
};

// Get file from S3/R2
export const getFromS3 = async (key) => {
  const s3Client = initializeS3Client();

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  try {
    const result = await s3Client.send(command);
    const bodyContents = await streamToString(result.Body);
    return bodyContents;
  } catch (error) {
    throw new Error(`Storage Get Error: ${error.message}`);
  }
};

// Delete file from S3/R2
export const deleteFromS3 = async (key) => {
  const s3Client = initializeS3Client();

  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    throw new Error(`Storage Delete Error: ${error.message}`);
  }
};

// Update file in S3/R2
export const updateInS3 = async (fileContent, key, contentType) => {
  // S3/R2 update is same as upload (overwrite)
  return await uploadToS3(fileContent, key, contentType);
};
