import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv(file = '.env') {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const required = [
  ['MONGODB_URI or MONGO_URI', Boolean(process.env.MONGODB_URI || process.env.MONGO_URI)],
  ['JWT_SECRET', Boolean(process.env.JWT_SECRET && !String(process.env.JWT_SECRET).includes('PASTE_'))],
  ['FRONTEND_URL or CLIENT_URL', Boolean(process.env.FRONTEND_URL || process.env.CLIENT_URL)],
  ['ADMIN_USERNAME', Boolean(process.env.ADMIN_USERNAME || process.env.STAFF_USERNAME)],
  ['ADMIN_PASSWORD', Boolean(process.env.ADMIN_PASSWORD || process.env.STAFF_PASSWORD)],
  ['DEV_USERNAME or DEVELOPER_USERNAME', Boolean(process.env.DEV_USERNAME || process.env.DEVELOPER_USERNAME)],
  ['DEV_PASSWORD or DEVELOPER_PASSWORD', Boolean(process.env.DEV_PASSWORD || process.env.DEVELOPER_PASSWORD)]
];

const optional = [
  ['PAYSTACK_SECRET_KEY', Boolean(process.env.PAYSTACK_SECRET_KEY && !String(process.env.PAYSTACK_SECRET_KEY).includes('PASTE_'))],
  ['GOOGLE_CLIENT_ID', Boolean(process.env.GOOGLE_CLIENT_ID && String(process.env.GOOGLE_CLIENT_ID).endsWith('.apps.googleusercontent.com'))],
  ['GOOGLE_CLIENT_SECRET or GOOGLE_SECRET_ID', Boolean(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET_ID || process.env.GOOGLE_SECRET)],
  ['SMTP email settings', Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && !String(process.env.SMTP_PASS).includes('PASTE_'))],
  ['PLATFORM_CURRENCY', Boolean(process.env.PLATFORM_CURRENCY || 'USD')]
];

let failed = false;
console.log('Tyna Systems backend environment check');
for (const [name, ok] of required) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed = true;
}
for (const [name, ok] of optional) {
  console.log(`${ok ? '✅' : '⚠️'} ${name}`);
}

if (failed) {
  console.error('\nRequired environment values are missing. Add them in Render Environment before deployment.');
  process.exit(1);
}
console.log('\nEnvironment format looks ready. Database connectivity is checked at server startup on Render.');
