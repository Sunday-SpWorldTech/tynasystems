import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendUserAccessAlert } from '../utils/email.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    company: user.company,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt
  };
}

async function joinFreeHandler(req, res, next) {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Account already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, company, phone });
    await sendUserAccessAlert(user, 'join-free');
    await logActivity(req, { type: 'registration', user: user._id, name: user.name, email: user.email, title: 'New Join Free registration', detail: `${user.name} created an account.` });
    const token = signToken(user);
    res.status(201).json({ message: 'Join Free successful', token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

router.post('/join-free', joinFreeHandler);
router.post('/register', joinFreeHandler);


async function getOrCreateStaffUser() {
  const staffUsername = process.env.STAFF_USERNAME || 'Tyna2026';
  const staffPassword = process.env.STAFF_PASSWORD || 'Systems2026';
  const staffEmail = (process.env.STAFF_EMAIL || 'staff@tynasystems.com').toLowerCase().trim();
  let user = await User.findOne({ email: staffEmail });
  const passwordHash = await bcrypt.hash(staffPassword, 12);

  if (!user) {
    user = await User.create({
      name: `${staffUsername} Staff`,
      email: staffEmail,
      passwordHash,
      role: 'staff',
      status: 'active'
    });
  } else {
    user.name = user.name || `${staffUsername} Staff`;
    user.passwordHash = passwordHash;
    user.role = 'staff';
    user.status = 'active';
    await user.save();
  }

  return user;
}

router.post('/staff-login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const staffUsername = process.env.STAFF_USERNAME || 'Tyna2026';
    const staffPassword = process.env.STAFF_PASSWORD || 'Systems2026';

    if (!username || !password) return res.status(400).json({ message: 'Staff username and password are required' });
    if (String(username).trim() !== staffUsername || String(password) !== staffPassword) {
      return res.status(401).json({ message: 'Invalid staff login details' });
    }

    const user = await getOrCreateStaffUser();
    user.lastLoginAt = new Date();
    await user.save();
    await sendUserAccessAlert(user, 'login');
    await logActivity(req, { type: 'login', user: user._id, name: user.name, email: user.email, title: 'Staff login', detail: `${user.name} accessed the staff panel.` });
    const token = signToken(user);
    res.json({ message: 'Staff login successful', token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid login details' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact staff support.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid login details' });

    user.lastLoginAt = new Date();
    await user.save();
    await sendUserAccessAlert(user, 'login');
    await logActivity(req, { type: 'login', user: user._id, name: user.name, email: user.email, title: 'User login', detail: `${user.name} logged in.` });
    const token = signToken(user);
    res.json({ message: 'Login successful', token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required' });
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).json({ message: 'GOOGLE_CLIENT_ID is not configured' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ message: 'Google login failed' });

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        avatarUrl: payload.picture || '',
        passwordHash: ''
      });
      await sendUserAccessAlert(user, 'join-free');
      await logActivity(req, { type: 'registration', user: user._id, name: user.name, email: user.email, title: 'Google Join Free registration', detail: `${user.name} joined with Google.` });
    } else {
      user.googleId = user.googleId || payload.sub;
      user.avatarUrl = payload.picture || user.avatarUrl;
      user.lastLoginAt = new Date();
      await user.save();
      await sendUserAccessAlert(user, 'login');
      await logActivity(req, { type: 'login', user: user._id, name: user.name, email: user.email, title: 'Google login', detail: `${user.name} logged in with Google.` });
    }
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact staff support.' });
    const token = signToken(user);
    res.json({ message: 'Google login successful', token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.currentUser) });
});

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, company, phone } = req.body;
    if (name) req.currentUser.name = name.trim();
    if (company !== undefined) req.currentUser.company = company.trim();
    if (phone !== undefined) req.currentUser.phone = phone.trim();
    await req.currentUser.save();
    res.json({ message: 'Profile updated', user: publicUser(req.currentUser) });
  } catch (err) { next(err); }
});

export default router;
