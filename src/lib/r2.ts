/**
 * src/lib/r2.ts
 *
 * Cloudflare R2 / S3-compatible client setup.
 *
 * Prefixing convention:
 * - public/*  : Assets, Product Images, Public Profiles (Served via public R2.dev or custom domain)
 * - private/* : Deliverables, secure uploads (Served via signed URLs ONLY)
 */

import { S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "direct-media";
