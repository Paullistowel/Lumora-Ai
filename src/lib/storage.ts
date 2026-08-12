import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Local-disk implementation of the file store. The interface is deliberately
 * S3/MinIO-shaped (opaque keys, no directory semantics) so swapping in an
 * object-storage client touches only this file.
 */

const ROOT = resolve(process.env.STORAGE_DIR ?? "./storage");

function pathFor(key: string) {
  const full = resolve(ROOT, key);
  // Defence against a crafted key traversing out of the store.
  if (!full.startsWith(ROOT)) throw new Error("Invalid storage key");
  return full;
}

export async function putFile(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  const extension = originalName.slice(originalName.lastIndexOf("."));
  const key = join(
    new Date().toISOString().slice(0, 7), // YYYY-MM shard
    `${randomUUID()}${extension}`,
  );
  const full = pathFor(key);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return key;
}

export function getFile(key: string): Promise<Buffer> {
  return readFile(pathFor(key));
}

export async function deleteFile(key: string): Promise<void> {
  await unlink(pathFor(key)).catch(() => undefined);
}
