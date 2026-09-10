import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

// ─── Storage Interface ────────────────────────────────────────────────────────
// Abstracted behind this interface so swapping to S3 requires only implementing
// this module's functions with the AWS SDK — no application-layer changes.
// TODO: implement S3 driver when STORAGE_DRIVER=s3 using @aws-sdk/client-s3

function ensureUploadDir(): void {
  const uploadDir = path.resolve(config.storage.uploadDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/**
 * Move/copy a file from sourcePath (e.g. multer temp path) to the uploads directory.
 * Returns a relative URL path like /uploads/filename.ext
 */
export async function saveFile(sourcePath: string, filename: string): Promise<string> {
  ensureUploadDir();
  const uploadDir = path.resolve(config.storage.uploadDir);
  const dest = path.join(uploadDir, filename);
  await fs.promises.rename(sourcePath, dest).catch(async () => {
    // Cross-device rename fails — fall back to copy + delete
    await fs.promises.copyFile(sourcePath, dest);
    await fs.promises.unlink(sourcePath).catch(() => {});
  });
  return `/uploads/${filename}`;
}

/**
 * Save a Buffer directly to the uploads directory (for generated files like PDFs).
 * Returns a relative URL path like /uploads/filename.ext
 */
export async function saveBuffer(buffer: Buffer, filename: string): Promise<string> {
  ensureUploadDir();
  const uploadDir = path.resolve(config.storage.uploadDir);
  const dest = path.join(uploadDir, filename);
  await fs.promises.writeFile(dest, buffer);
  return `/uploads/${filename}`;
}

/**
 * Get absolute filesystem path from a relative URL path like /uploads/filename.ext
 */
export function getFilePath(relativePath: string): string {
  const filename = path.basename(relativePath);
  return path.join(path.resolve(config.storage.uploadDir), filename);
}

/**
 * Get full public URL or keep as relative path.
 */
export function getFileUrl(relativePath: string): string {
  return relativePath; // Served via express.static
}

/**
 * Delete a file by its relative URL path.
 */
export async function deleteFile(relativePath: string): Promise<void> {
  const absPath = getFilePath(relativePath);
  await fs.promises.unlink(absPath).catch(() => {});
}
