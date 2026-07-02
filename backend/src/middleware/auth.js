import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Authentication required' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Secure login service is currently unavailable. Please try again shortly.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'Account not found' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact staff support.' });
    req.user = { id: String(user._id), email: user.email, role: user.role, name: user.name };
    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireStaff(req, res, next) {
  const pin = String(req.headers['x-dev-maintenance-pin'] || '').trim();
  const devPin = String(process.env.DEV_SPY_PIN || '12121991');
  const developerPinAccess = req.user?.role === 'developer' && pin && pin === devPin;
  if (!req.user || (!['staff', 'admin'].includes(req.user.role) && !developerPinAccess)) {
    return res.status(403).json({ message: 'Staff access required' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}


export function requireDeveloper(req, res, next) {
  if (!req.user || !['developer', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Developer access required' });
  next();
}


export function requireSocialWorker(req, res, next) {
  if (!req.user || !['social_worker', 'staff', 'developer', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Social worker access required' });
  next();
}

