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
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'Tyna Systems API',
    database: 'MongoDB',
    payments: 'Paystack',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', staffRoutes); // Legacy API alias for existing integrations

const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

const frontendAliases = {
  '/login': 'login.html',
  '/joinfree': 'joinfree.html',
  '/join-free': 'joinfree.html',
  '/register': 'joinfree.html',
  '/dashboard': 'dashboard.html',
  '/staff': 'staff.html',
  '/staff-login': 'staff-login.html',
  '/support': 'support.html',
  '/settings': 'settings.html',
  '/contact-staff': 'contact-staff.html'
};
Object.entries(frontendAliases).forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(frontendDir, file)));
});

// Express-safe fallback. This avoids app.get('*') errors in newer router versions.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  return res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
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
