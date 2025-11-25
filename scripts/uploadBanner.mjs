import { readFile } from 'node:fs/promises';
import { put } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('Missing BLOB_READ_WRITE_TOKEN');
  process.exit(1);
}

const filePath = 'packages/nextjs/public/shadow-banner.jpg';
const file = await readFile(filePath);

const blob = await put('shadow-banner.jpg', file, {
  access: 'public',
  token,
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'image/jpeg',
});

console.log('Uploaded banner to:', blob.url);
