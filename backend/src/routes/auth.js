import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendUserAccessAlert, sendAuthOtpEmail } from '../utils/email.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET_ID || process.env.GOOGLE_SECRET;
const googleClient = new OAuth2Client(googleClientId); // Google Identity Services ID-token verification uses the Client ID audience. The secret stays in env for OAuth setup/readiness checks.

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('Secure login service is currently unavailable. Please try again shortly.');
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
    accountType: user.accountType,
    schoolEmail: user.schoolEmail,
    schoolName: user.schoolName,
    studentId: user.studentId,
    studentIdNumber: user.studentIdNumber,
    enrollmentNumber: user.enrollmentNumber,
    department: user.department,
    level: user.level,
    businessName: user.businessName,
    businessType: user.businessType,
    businessAddress: user.businessAddress,
    country: user.country,
    businessEmail: user.businessEmail,
    businessPhone: user.businessPhone,
    serviceNeeded: user.serviceNeeded,
    identityStatus: user.identityStatus,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    workerRole: user.workerRole,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt
  };
}

function normalizeCredential(value = '') {
  return String(value || '').trim().toLowerCase();
}

const authOtpStore = new Map();
const pendingTwoFactorStore = new Map();

function makeOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
function randomBase32(length = 20) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}
function base32ToBuffer(base32 = '') {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of String(base32).replace(/=+$/,'').toUpperCase()) {
    const val = alphabet.indexOf(ch);
    if (val >= 0) bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function hotp(secret, counter, digits = 6) {
  const key = base32ToBuffer(secret);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % (10 ** digits)).padStart(digits, '0');
}
function verifyTotp(secret, token = '', window = 1) {
  const clean = String(token || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(clean) || !secret) return false;
  const counter = Math.floor(Date.now() / 30000);
  for (let drift = -window; drift <= window; drift += 1) {
    if (hotp(secret, counter + drift) === clean) return true;
  }
  return false;
}
function authOtpKey(email = '', purpose = 'auth') { return `${purpose}:${normalizeCredential(email)}`; }
async function sendAuthOtp(user, purpose = 'auth') {
  const email = user.schoolEmail || user.businessEmail || user.email;
  const code = makeOtp();
  authOtpStore.set(authOtpKey(email, purpose), { code, userId: String(user._id), expiresAt: Date.now() + 10 * 60 * 1000, purpose });
  const delivery = await sendAuthOtpEmail(email, code, user.name);
  return { email, skippedEmail: !!delivery?.skipped, devOtp: delivery?.skipped ? code : undefined };
}
function roleProfile(role = '', workerRole = '') {
  const normalized = String(role || '').trim();
  const worker = normalizeSocialRole(workerRole || 'operations_systems_manager');
  if (normalized === 'admin') return { name: 'Tyna Systems Admin', email: 'admin@tynasystems.local', role: 'admin', company: 'Tyna Systems Command Center' };
  if (normalized === 'developer') return { name: 'Sunday Prince Augustine', email: 'developer@tynasystems.local', role: 'developer', company: 'FullStack Software Development Engineering' };
  return { name: 'Tyna Systems Social Worker', email: `${worker}@tynasystems.local`, role: 'social_worker', workerRole: worker, company: 'Tyna Systems Social Worker Team' };
}
function otpauthUrl(user, secret) {
  const label = encodeURIComponent(`Tyna Systems:${user.email}`);
  const issuer = encodeURIComponent('Tyna Systems');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function roleForTrustedGoogleEmail(email = '') {
  const normalized = normalizeCredential(email);
  const adminEmail = normalizeCredential(process.env.ADMIN_EMAIL || process.env.STAFF_EMAIL || 'admin@tynasystems.com');
  const devEmail = normalizeCredential(process.env.DEV_EMAIL || process.env.DEVELOPER_EMAIL || 'support@tynasystems.com');
  if (normalized && normalized === devEmail) return 'developer';
  if (normalized && normalized === adminEmail) return 'admin';
  return 'client';
}

function credentialCandidates(...values) {
  return values.map(value => String(value || '').trim()).filter(Boolean);
}

function matchesCredential(input, candidates, { caseSensitive = false } = {}) {
  const value = String(input || '').trim();
  if (!value) return false;
  return candidates.some(candidate => caseSensitive ? value === candidate : normalizeCredential(value) === normalizeCredential(candidate));
}

async function joinFreeHandler(req, res, next) {
  try {
    const {
      name, email, password, pin, company, phone, accountType,
      schoolEmail, schoolName, studentId, studentIdNumber, enrollmentNumber, department, level,
      businessName, businessType, businessAddress, country, businessEmail, businessPhone, serviceNeeded, businessDetails
    } = req.body;
    if (!name || !email || !password || !pin) return res.status(400).json({ message: 'Name, email, password and PIN are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const cleanPin = String(pin || '').replace(/\D/g, '').slice(0, 8);
    if (!/^\d{4,8}$/.test(cleanPin)) return res.status(400).json({ message: 'PIN must be 4 to 8 digits.' });

    const normalizedEmail = email.toLowerCase().trim();
    const studentMode = accountType === 'student';
    const businessMode = !studentMode;
    const finalStudentId = String(studentIdNumber || studentId || '').trim();
    const finalBusinessEmail = String(businessEmail || email).toLowerCase().trim();

    if (studentMode && (!schoolName || !finalStudentId || !enrollmentNumber)) {
      return res.status(400).json({ message: 'School name, student ID number and enrollment number are required for student signup.' });
    }
    if (businessMode && (!businessName || !businessType || !businessAddress || !country || !finalBusinessEmail || !serviceNeeded)) {
      return res.status(400).json({ message: 'Complete business details are required for business signup.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Account already exists. Please login.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      rolePinHash: await bcrypt.hash(cleanPin, 12),
      company: businessMode ? String(businessName || company || '').trim() : String(company || schoolName || '').trim(),
      phone: String(phone || businessPhone || '').trim(),
      role: 'client',
      status: 'active',
      accountType: studentMode ? 'student' : 'business',
      schoolEmail: studentMode ? String(schoolEmail || email).toLowerCase().trim() : '',
      schoolName: studentMode ? String(schoolName || '').trim() : '',
      studentId: studentMode ? finalStudentId : '',
      studentIdNumber: studentMode ? finalStudentId : '',
      enrollmentNumber: studentMode ? String(enrollmentNumber || '').trim() : '',
      department: studentMode ? String(department || '').trim() : '',
      level: studentMode ? String(level || '').trim() : '',
      businessName: businessMode ? String(businessName || company || '').trim() : '',
      businessType: businessMode ? String(businessType || '').trim() : '',
      businessAddress: businessMode ? String(businessAddress || '').trim() : '',
      country: businessMode ? String(country || '').trim() : '',
      businessEmail: businessMode ? finalBusinessEmail : '',
      businessPhone: businessMode ? String(businessPhone || phone || '').trim() : '',
      serviceNeeded: businessMode ? String(serviceNeeded || '').trim() : '',
      businessDetails: businessMode ? String(businessDetails || `${businessName || ''} ${businessType || ''} ${serviceNeeded || ''}`.trim()).trim() : '',
      identityStatus: 'verified',
      emailVerified: true,
      twoFactorEnabled: false
    });

    await sendUserAccessAlert(user, 'join-free').catch(() => {});
    await logActivity(req, {
      type: 'registration',
      user: user._id,
      name: user.name,
      email: user.email,
      title: studentMode ? 'New student signup' : 'New business signup',
      detail: `${user.name} signed up as ${studentMode ? 'student' : 'business user'} and created a secure dashboard PIN.`,
      metadata: { accountType: user.accountType, schoolName: user.schoolName, studentIdNumber: user.studentIdNumber, enrollmentNumber: user.enrollmentNumber, businessName: user.businessName, businessType: user.businessType, serviceNeeded: user.serviceNeeded }
    });

    const token = signToken(user);
    res.status(201).json({ message: 'Signup successful. Your secure PIN is active for dashboard login.', token, user: publicUser(user) });
  } catch (err) { next(err); }
}
router.post('/join-free', joinFreeHandler);
router.post('/register', joinFreeHandler);




router.post('/dev-login', async (req, res) => {
  res.status(410).json({ message: 'Developer username login has been removed. Use the calculator PIN gateway.' });
});
router.post('/staff-login', async (req, res) => {
  res.status(410).json({ message: 'Admin/staff username login has been removed. Use the calculator PIN gateway.' });
});

const allowedSocialRoles = ['founder_advancement', 'operations_systems_manager', 'chartered_accountant', 'client_relationship_manager'];
function normalizeSocialRole(value = 'general') {
  return allowedSocialRoles.includes(value) ? value : 'general';
}

router.post('/social-register', async (req, res, next) => {
  try {
    const { name, email, password, phone, workerRole } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Social worker account already exists. Please login.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, phone, role: 'social_worker', workerRole: normalizeSocialRole(workerRole), company: 'Tyna Systems Social Worker Team' });
    await sendUserAccessAlert(user, 'join-free');
    await logActivity(req, { type: 'registration', user: user._id, name: user.name, email: user.email, title: 'Social worker registration', detail: `${user.name} registered as ${user.workerRole}.` });
    const token = signToken(user);
    res.status(201).json({ message: 'Social worker registration successful', token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/social-login', async (req, res, next) => {
  try {
    const { email, password, workerRole } = req.body;
    if (!email || !password || !workerRole) return res.status(400).json({ message: 'Email, password and login role are required' });
    const selectedRole = normalizeSocialRole(workerRole);
    if (selectedRole === 'general') return res.status(400).json({ message: 'Select a valid social worker role' });
    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'social_worker' });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid social worker login details' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact admin support.' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid social worker login details' });
    if (user.workerRole && user.workerRole !== 'general' && user.workerRole !== selectedRole) {
      return res.status(403).json({ message: 'Selected role does not match this social worker account' });
    }
    user.workerRole = selectedRole;
    user.lastLoginAt = new Date();
    await user.save();
    sendUserAccessAlert(user, 'login').catch(() => {});
    await logActivity(req, { type: 'login', user: user._id, name: user.name, email: user.email, title: 'Social worker login', detail: `${user.name} accessed the social worker dashboard as ${user.workerRole}.` });
    const token = signToken(user);
    res.json({ message: 'Social worker login successful', token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/google-social', async (req, res) => {
  res.status(410).json({ message: 'Google sign-in has been removed. Use email and password login.' });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, loginId, username, password, pin } = req.body;
    const credential = normalizeCredential(email || loginId || username);
    const cleanPin = String(pin || '').replace(/\D/g, '').slice(0, 8);
    if (!credential || !password || !cleanPin) return res.status(400).json({ message: 'Login email/username, password and PIN are required' });
    if (!/^\d{4,8}$/.test(cleanPin)) return res.status(400).json({ message: 'PIN must be 4 to 8 digits.' });
    const users = await User.find({
      role: 'client',
      $or: [
        { email: credential },
        { schoolEmail: credential },
        { businessEmail: credential }
      ]
    });
    let user = users[0] || null;
    if (!user) {
      const rawName = String(email || loginId || username).trim();
      const escapedName = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const byName = await User.findOne({ role: 'client', name: new RegExp(`^${escapedName}$`, 'i') });
      user = byName;
    }
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid login details' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact staff support.' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid login details' });
    if (!user.rolePinHash) return res.status(403).json({ message: 'PIN is not set for this account. Use Retrieve / reset PIN to create one.' });
    const pinOk = await bcrypt.compare(cleanPin, user.rolePinHash);
    if (!pinOk) return res.status(401).json({ message: 'Invalid PIN for this account.' });
    user.emailVerified = true;
    user.identityStatus = user.identityStatus || 'verified';
    user.lastLoginAt = new Date(); await user.save();
    sendUserAccessAlert(user, 'login').catch(() => {});
    await logActivity(req, { type: 'login', user: user._id, name: user.name, email: user.email, title: 'User PIN login', detail: `${user.name} logged in with email/username and PIN.` });
    const token = signToken(user);
    res.json({ message: 'Login successful', token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/reset-pin', async (req, res, next) => {
  try {
    const { email, loginId, username, password, pin } = req.body;
    const credential = normalizeCredential(email || loginId || username);
    const cleanPin = String(pin || '').replace(/\D/g, '').slice(0, 8);
    if (!credential || !password || !cleanPin) return res.status(400).json({ message: 'Email/username, password and new PIN are required.' });
    if (!/^\d{4,8}$/.test(cleanPin)) return res.status(400).json({ message: 'PIN must be 4 to 8 digits.' });
    const users = await User.find({
      role: 'client',
      $or: [
        { email: credential },
        { schoolEmail: credential },
        { businessEmail: credential }
      ]
    });
    let user = users[0] || null;
    if (!user) {
      const rawName = String(email || loginId || username).trim();
      const escapedName = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ role: 'client', name: new RegExp(`^${escapedName}$`, 'i') });
    }
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid account details.' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid account details.' });
    user.rolePinHash = await bcrypt.hash(cleanPin, 12);
    await user.save();
    await logActivity(req, { type: 'security', user: user._id, name: user.name, email: user.email, title: 'User PIN reset', detail: `${user.name} reset dashboard PIN after password verification.` });
    res.json({ message: 'PIN reset successful. You can now login with your new PIN.' });
  } catch (err) { next(err); }
});

router.post('/google', async (req, res) => {
  res.status(410).json({ message: 'Google sign-in has been removed. Use email and password login.' });
});


router.post('/request-otp', async (req, res) => {
  return res.status(410).json({ message: 'OTP has been removed. Use your secure PIN.' });
});

router.post('/request-otp-disabled-old', async (req, res, next) => {
  try {
    const { email, purpose = 'login' } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'Account not found' });
    const delivery = await sendAuthOtp(user, purpose);
    res.json({ message: 'OTP sent.', requiresOtp: true, email: delivery.email, skippedEmail: delivery.skippedEmail, devOtp: delivery.devOtp });
  } catch (err) { next(err); }
});

router.post('/verify-otp', async (req, res) => {
  return res.status(410).json({ message: 'OTP has been removed. Use your secure PIN.' });
});

router.post('/verify-otp-disabled-old', async (req, res, next) => {
  try {
    const { email, otp, purpose = 'register' } = req.body;
    const cleanEmail = String(email || '').toLowerCase().trim();
    const record = authOtpStore.get(authOtpKey(cleanEmail, purpose)) || authOtpStore.get(authOtpKey(cleanEmail, 'register')) || authOtpStore.get(authOtpKey(cleanEmail, 'login'));
    if (!record || record.expiresAt < Date.now()) return res.status(400).json({ message: 'OTP expired. Request a new OTP.' });
    if (String(record.code) !== String(otp || '').trim()) return res.status(400).json({ message: 'Invalid OTP code' });
    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ message: 'Account not found' });
    user.emailVerified = true; user.identityStatus = 'verified'; user.otpVerifiedAt = new Date();
    if (!user.twoFactorSecret) user.twoFactorSecret = randomBase32();
    await user.save(); authOtpStore.delete(authOtpKey(cleanEmail, purpose));
    res.json({ message: 'Email verification route is disabled. Use your secure PIN.', requiresTwoFactorSetup: true, setupCode: user.twoFactorSecret, otpauthUrl: otpauthUrl(user, user.twoFactorSecret), email: user.email });
  } catch (err) { next(err); }
});

router.post('/verify-2fa', async (req, res) => {
  return res.status(410).json({ message: 'Authenticator verification has been removed. Use your secure PIN.' });
});

router.post('/verify-2fa-disabled-old', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!user.emailVerified) return res.status(403).json({ message: 'Verify your email OTP first.' });
    if (!verifyTotp(user.twoFactorSecret, code)) return res.status(400).json({ message: 'Invalid PIN' });
    user.twoFactorEnabled = true; user.identityStatus = 'verified'; user.lastLoginAt = new Date(); await user.save();
    const token = signToken(user);
    res.json({ message: 'Two-factor verification successful', token, user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/role-pin-session', async (req, res, next) => {
  try {
    const { role, pin, workerRole } = req.body;
    const cleanPin = String(pin || '').trim();
    if (!/^\d{4,8}$/.test(cleanPin)) return res.status(400).json({ message: 'PIN must be 4 to 8 digits.' });
    const profile = roleProfile(role, workerRole);
    let user = await User.findOne({ email: profile.email });
    const isFirstSetup = !user || !user.rolePinHash;
    if (!user) {
      user = await User.create({ ...profile, passwordHash: '', rolePinHash: await bcrypt.hash(cleanPin, 12), status: 'active', emailVerified: true, identityStatus: 'verified', twoFactorEnabled: false });
    } else {
      if (!user.rolePinHash) user.rolePinHash = await bcrypt.hash(cleanPin, 12);
      else {
        const ok = await bcrypt.compare(cleanPin, user.rolePinHash);
        if (!ok) return res.status(401).json({ message: 'Incorrect role PIN.' });
      }
      Object.assign(user, profile, { status: 'active', emailVerified: true, identityStatus: 'verified', twoFactorEnabled: false, lastLoginAt: new Date() });
      await user.save();
    }
    await logActivity(req, { type: 'login', user: user._id, name: user.name, email: user.email, title: 'Calculator PIN role access', detail: `${user.name} opened ${profile.role} dashboard through calculator PIN gateway.` });
    const token = signToken(user);
    res.json({ message: isFirstSetup ? 'Role PIN created. Access granted.' : 'Role access granted', token, user: publicUser(user) });
  } catch (err) { next(err); }
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

