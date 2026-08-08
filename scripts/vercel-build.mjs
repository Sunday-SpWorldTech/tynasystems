import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const frontend = resolve(root, 'frontend');
const publicDir = resolve(root, 'public');

// Generate browser-safe config from Vercel environment variables.
execFileSync(process.execPath, ['scripts/write-config.js'], {
  cwd: frontend,
  stdio: 'inherit',
  env: process.env
});

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(frontend, publicDir, {
  recursive: true,
  filter(source) {
    const normalized = source.replace(/\\/g, '/');
    if (normalized.includes('/node_modules/')) return false;
    if (normalized.endsWith('/node_modules')) return false;
    if (/\/(?:\.env|\.env\..+)$/.test(normalized)) return false;
    if (normalized.includes('/scripts/')) return false;
    return true;
  }
});

if (!existsSync(resolve(publicDir, 'index.html'))) {
  throw new Error('Vercel build failed: public/index.html was not created.');
}
console.log('Vercel frontend output created at public/.');
