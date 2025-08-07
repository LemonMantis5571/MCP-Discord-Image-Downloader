import fs from 'node:fs/promises';
import fsSync from 'node:fs';

export async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export function createWriteStream(path: string) {
  return fsSync.createWriteStream(path);
}