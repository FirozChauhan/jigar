import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const BUCKET = process.env.R2_BUCKET_NAME ?? "";

function isConfigured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET);
}

const client = isConfigured()
  ? new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
    })
  : null;

/** Upload a file to the R2 bucket; returns the public URL when stored. */
export async function uploadToR2(opts: {
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
}): Promise<string> {
  if (!client) {
    throw new Error("R2 storage is not configured (missing R2_* env vars).");
  }
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${process.env.NEXT_PUBLIC_R2_DOMAIN ?? ""}/${opts.key}`;
}