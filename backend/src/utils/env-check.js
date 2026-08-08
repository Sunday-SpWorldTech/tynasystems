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

const hasValue = (name) => Boolean(String(process.env[name] || '').trim());
const required = [
  ['MONGODB_URI or MONGO_URI', hasValue('MONGODB_URI') || hasValue('MONGO_URI')],
  ['JWT_SECRET', hasValue('JWT_SECRET')],
  ['FRONTEND_URL or CLIENT_URL', hasValue('FRONTEND_URL') || hasValue('CLIENT_URL')]
];

const optional = [
  ['PAYSTACK_SECRET_KEY', hasValue('PAYSTACK_SECRET_KEY')],
  ['PAYSTACK_PUBLIC_KEY', hasValue('PAYSTACK_PUBLIC_KEY')],
  ['FX_USD_NGN', Number(process.env.FX_USD_NGN) > 0],
  ['TYNA_API_KEY', hasValue('TYNA_API_KEY') || hasValue('TYNA_INTERNAL_API_KEY')],
  ['TYNA_SECRET_KEY', hasValue('TYNA_SECRET_KEY') || hasValue('TYNA_SECRET') || hasValue('TYNA_TOKEN_SECRET')],
  ['SMTP email settings', hasValue('SMTP_HOST') && hasValue('SMTP_USER') && hasValue('SMTP_PASS')],
  ['Google AI Studio key', hasValue('GOOGLE_AI_STUDIO_API_KEY') || hasValue('GEMINI_API_KEY')],
  ['PLATFORM_CURRENCY', hasValue('PLATFORM_CURRENCY')],
  ['Azure Translator', hasValue('AZURE_TRANSLATOR_KEY') && hasValue('AZURE_TRANSLATOR_REGION')],
  ['AZURE_TRANSLATOR_ENDPOINT', hasValue('AZURE_TRANSLATOR_ENDPOINT')]
];

let failed = false;
console.log('Tyna Systems backend environment check');
for (const [name, ok] of required) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed = true;
}
for (const [name, ok] of optional) console.log(`${ok ? '✅' : '⚠️'} ${name}`);

if (failed) {
  console.error('\nRequired environment values are missing. Add them in Vercel Environment Variables before deployment.');
  process.exit(1);
}
console.log('\nEnvironment names and required values look ready. Connectivity is checked at server startup.');
