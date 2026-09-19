/**
 * src/services/mediaService.ts
 *
 * Media generation, signed URLs, and Media DB records.
 */

import { r2, R2_BUCKET_NAME } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface GenerateUploadIntentOptions {
  userId?: string;
  filename: string;
  contentType: string;
  isPrivate: boolean; // false = public/ prefix, true = private/ prefix
  entityType?: string;
  entityId?: string;
}

export async function generateUploadIntent(options: GenerateUploadIntentOptions) {
  const { filename, contentType, isPrivate, userId, entityType, entityId } = options;
  
  const ext = filename.split('.').pop();
  const fileKey = `${crypto.randomUUID()}.${ext}`;
  const prefix = isPrivate ? "private" : "public";
  const fullKey = `${prefix}/${fileKey}`;

  // Create intent record in DB
  const media = await prisma.media.create({
    data: {
      url: fullKey,
      fileType: contentType,
      isPublic: !isPrivate,
      uploadedById: userId,
      // Metadata to identify where this belongs once processed
      metadata: { entityType, entityId },
    },
  });

  // Generate presigned PUT URL
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fullKey,
    ContentType: contentType,
    // Add AWS-compatible metadata headers for the worker to read if needed
    Metadata: {
      "media-id": media.id,
    },
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour

  return { uploadUrl, mediaId: media.id, fullKey };
}

/**
 * Generate a short-lived signed URL for a private asset.
 */
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}
