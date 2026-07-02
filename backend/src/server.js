import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';
import bookingRoutes from './routes/bookings.js';
import productRoutes from './routes/products.js';
import paymentRoutes from './routes/payments.js';
import supportRoutes from './routes/support.js';
import staffRoutes from './routes/staff.js';
import activityRoutes from './routes/activities.js';
import developerRoutes from './routes/developer.js';
import devTokenRoutes from './routes/devToken.js';
import socialRoutes from './routes/social.js';
import chatRoutes from './routes/chat.js';
import academyRoutes from './routes/academy.js';
import settingsRoutes, { getMaintenanceSetting } from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeOrigin(value = '') {
  const trimmed = String(value).trim().replace(/\/$/, '');
  if (!trimmed) return '';
  try { return new URL(trimmed).origin; } catch { return trimmed; }
}

function parseOrigins(value = '') {
  return String(value)
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

const allowedOrigins = new Set([
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGINS),
  'https://tynasystems-frontend.onrender.com',
  'https://tynasystems.com',
  'https://www.tynasystems.com',
  'https://tynasystem.com',
  'https://www.tynasystem.com',
  'http://tynasystems.com',
  'http://www.tynasystems.com',
  'http://tynasystem.com',
  'http://www.tynasystem.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
].map(normalizeOrigin));

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.has(normalized)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/assets/images/uploads', express.static(path.resolve(__dirname, '../../frontend/assets/images/uploads')));

function hasEnv(name) {
  const value = process.env[name];
  return Boolean(value && !String(value).toLowerCase().includes('your_') && !String(value).toLowerCase().includes('sample_'));
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'Tyna Systems API',
    database: 'MongoDB',
    payments: 'Paystack',
    currency: process.env.PLATFORM_CURRENCY || 'USD',
    login: {
      adminConfigured: hasEnv('ADMIN_USERNAME') && hasEnv('ADMIN_PASSWORD'),
      developerConfigured: (hasEnv('DEV_USERNAME') || hasEnv('DEVELOPER_USERNAME')) && (hasEnv('DEV_PASSWORD') || hasEnv('DEVELOPER_PASSWORD')),
      jwtConfigured: hasEnv('JWT_SECRET')
    },
    env: {
      mongodb: hasEnv('MONGODB_URI') || hasEnv('MONGO_URI'),
      paystackSecret: hasEnv('PAYSTACK_SECRET_KEY'),
      googleClient: hasEnv('GOOGLE_CLIENT_ID'),
      googleSecret: hasEnv('GOOGLE_CLIENT_SECRET') || hasEnv('GOOGLE_SECRET_ID') || hasEnv('GOOGLE_SECRET'),
      frontendUrl: hasEnv('FRONTEND_URL') || hasEnv('CLIENT_URL'),
      academySchoolDomains: hasEnv('ACADEMY_SCHOOL_EMAIL_DOMAINS'),
      academyOtpEmail: hasEnv('SMTP_HOST') && hasEnv('SMTP_USER') && hasEnv('SMTP_PASS')
    },
    time: new Date().toISOString()
  });
});

app.use('/api/settings', settingsRoutes);

app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  if (req.path.startsWith('/api/health') || req.path.startsWith('/api/settings/maintenance') || req.path.startsWith('/api/auth') || req.path.startsWith('/api/staff') || req.path.startsWith('/api/developer/dashboard') || req.path.startsWith('/api/dev-token') || req.path.startsWith('/api/academy/admin') || req.path.startsWith('/api/academy/developer') || req.path.startsWith('/api/social') || req.path.startsWith('/api/chat')) return next();
  try {
    const maintenance = await getMaintenanceSetting();
    if (maintenance.enabled) return res.status(503).json({ message: maintenance.message || 'Tyna Systems is under professional maintenance. Please check back shortly.', maintenance });
  } catch (error) {
    console.error('Maintenance check failed:', error.message);
  }
  return next();
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/dev-token', devTokenRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/courses', academyRoutes);
app.use('/api/lessons', academyRoutes);
app.use('/api/quizzes', academyRoutes);
app.use('/api/progress', academyRoutes);
app.use('/api/certificates', academyRoutes);
app.use('/api/admin', staffRoutes); // Legacy API alias for existing integrations

const frontendDir = path.resolve(__dirname, '../../frontend');
const privateViewsDir = path.resolve(__dirname, '../private-views');

function privateDeveloperPagesEnabled() {
  return String(process.env.TYNA_ENABLE_PRIVATE_DEV_PAGES || '').toLowerCase() === 'true';
}

function hiddenDeveloperPage(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.status(404).send('Page not found.');
}
app.get(['/developer-calculator.html', '/developer-calculator'], hiddenDeveloperPage);

app.use(express.static(frontendDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  setHeaders(res, filePath) {
    if (/\.(?:html)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
    if (/\.(?:webp|png|jpg|jpeg|svg|css|js)$/i.test(filePath) && process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

const frontendAliases = {
  '/login': 'login.html',
  '/joinfree': 'joinfree.html',
  '/join-free': 'joinfree.html',
  '/register': 'joinfree.html',
  '/dashboard': 'dashboard.html',
  '/staff': 'staff.html',
  '/admin': 'admin.html',
  '/admin-dashboard': 'admin.html',
  '/staff-dashboard': 'admin.html',
  '/admin-login': 'admin-login.html',
  '/staff-login': 'staff-login.html',
  '/support': 'support.html',
  '/support-workspace': 'support-workspace.html',
  '/settings': 'settings.html',
  '/contact-staff': 'contact-staff.html',
  '/developer': 'developer.html',
  '/developer-tools': 'developer-tools.html',
  '/community': 'community.html',
  '/internships': 'internships.html',
  '/internship-opportunity': 'internships.html',
  '/social-worker-login': 'social-worker-login.html',
  '/social-worker-register': 'social-worker-register.html',
  '/social-worker-dashboard': 'social-worker-dashboard.html',
  '/tyna-coding-academy': 'tyna-coding-academy.html',
  '/certificate': 'certificate.html',
  '/coding-academy': 'tyna-coding-academy.html',
  '/academy-html-foundations': 'academy-html-foundations.html',
  '/academy-css-professional-ui': 'academy-css-professional-ui.html',
  '/academy-javascript-core': 'academy-javascript-core.html',
  '/academy-python-for-builders': 'academy-python-for-builders.html',
  '/academy-react-frontend': 'academy-react-frontend.html',
  '/academy-node-express-api': 'academy-node-express-api.html',
  '/academy-mongodb-backend': 'academy-mongodb-backend.html',
  '/academy-premium-school-1': 'academy-premium-school-1.html',
  '/academy-premium-school-2': 'academy-premium-school-2.html',
  '/academy-premium-school-3': 'academy-premium-school-3.html',
  '/academy-course': 'academy-course.html',
};
Object.entries(frontendAliases).forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(frontendDir, file)));
});

// Developer login and dashboard HTML are intentionally kept outside the public frontend folder.
// The page shells are private; all sensitive dashboard data still requires JWT developer access.
app.get(['/dev-login', '/dev-login.html'], (req, res) => {
  if (!privateDeveloperPagesEnabled()) return hiddenDeveloperPage(req, res);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.sendFile(path.join(privateViewsDir, 'developer-login.html'));
});

app.get(['/dev', '/dev-dashboard', '/dev.html', '/dev-dashboard.html'], (req, res) => {
  if (!privateDeveloperPagesEnabled()) return hiddenDeveloperPage(req, res);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.sendFile(path.join(privateViewsDir, 'developer-dashboard.html'));
});


// Express-safe fallback. This avoids app.get('*') errors in newer router versions.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'The requested service is not available.' });
  }
  return res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const safeMessages = {
    400: 'We could not complete this request. Please check the details and try again.',
    401: 'Your secure session has expired. Please sign in again.',
    403: 'You do not have permission to access this secure area.',
    404: 'The requested service is not available.',
    409: 'This record already exists. Please review the details.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Service is currently unavailable. Please try again shortly.',
    502: 'Payment service is currently unavailable. Please try again shortly.',
    503: 'Tyna Systems is under professional maintenance. Please check back shortly.'
  };
  const message = process.env.NODE_ENV === 'production' ? (safeMessages[status] || safeMessages[500]) : (err.message || safeMessages[500]);
  res.status(status).json({ message });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Tyna Systems API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

startServer();

