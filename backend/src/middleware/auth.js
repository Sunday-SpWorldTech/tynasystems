import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Authentication required' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET is not configured' });

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
  if (!req.user || !['staff', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Staff access required' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}
