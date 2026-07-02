import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import DevTransferToken from '../models/DevTransferToken.js';
import CrossPlatformTransferLog from '../models/CrossPlatformTransferLog.js';
import Withdrawal from '../models/Withdrawal.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { requireAuth, requireDeveloper } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import { PLATFORM_CURRENCY, moneyRound } from '../utils/finance.js';

const router = express.Router();
const TOKEN_LIFETIME_YEARS = Number(process.env.TYNA_DEV_TRANSFER_TOKEN_LIFETIME_YEARS || 100);

function tokenSecret() {
  return process.env.TYNA_TRANSFER_TOKEN_SECRET || process.env.JWT_SECRET;
}

function hashToken(token = '') {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function createReference() {
  return `TYNA-SPW-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function requireInternalApiKey(req, res, next) {
  const expected = process.env.TYNA_INTERNAL_API_KEY;
  const received = req.headers['x-internal-api-key'];
  if (!expected || !received || received !== expected) {
    return res.status(401).json({ success: false, message: 'Unauthorized internal request.' });
  }
  return next();
}

async function developerWalletAvailable() {
  const [credits, withdrawals] = await Promise.all([
    WalletTransaction.find({ walletType: 'developer' }).select('amount').lean(),
    Withdrawal.find({ walletType: 'developer' }).select('amount status').lean()
  ]);
  const gross = moneyRound(credits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0));
  const reserved = moneyRound(withdrawals
    .filter(w => ['completed', 'approved', 'pending'].includes(w.status))
    .reduce((sum, w) => sum + Number(w.amount || 0), 0));
  return Math.max(0, moneyRound(gross - reserved));
}

async function findActiveToken(rawToken) {
  let decoded;
  try {
    decoded = jwt.verify(rawToken, tokenSecret());
  } catch {
    return { error: { status: 401, message: 'Invalid token.' } };
  }

  const token = await DevTransferToken.findOne({
    tokenId: decoded.tokenId,
    tokenHash: hashToken(rawToken),
    allowedSystem: 'spworldtech'
  });

  if (!token) return { error: { status: 401, message: 'Token was not found.' } };

  // Lifetime connection rule: previous SP WorldTech tokens must stay usable.
  // If an old record was marked revoked/expired before this update, silently restore it.
  if (token.status !== 'active') token.status = 'active';
  token.revokedAt = undefined;
  token.lastUsedAt = new Date();
  await token.save();
  return { token, decoded };
}

router.use('/dashboard', requireAuth, requireDeveloper);

router.post('/dashboard/create', async (req, res, next) => {
  try {
    if (!tokenSecret()) return res.status(500).json({ message: 'Transfer token secret is not configured.' });

    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_YEARS * 365 * 24 * 60 * 60 * 1000);
    const rawToken = jwt.sign({
      tokenId,
      developerId: String(req.currentUser._id),
      allowedSystem: 'spworldtech',
      permissions: ['balance:read', 'balance:transfer']
    }, tokenSecret());

    await DevTransferToken.create({
      developer: req.currentUser._id,
      tokenId,
      tokenHash: hashToken(rawToken),
      allowedSystem: 'spworldtech',
      permissions: ['balance:read', 'balance:transfer'],
      expiresAt,
      metadata: { createdFrom: 'tyna_developer_dashboard' }
    });

    await logActivity(req, {
      type: 'developer_action',
      title: 'SP WorldTech transfer token created',
      detail: `${req.currentUser.name} created a lifetime SP WorldTech balance forwarding token.`,
      metadata: { tokenId, allowedSystem: 'spworldtech' }
    });

    return res.status(201).json({
      success: true,
      message: 'Secure lifetime SP WorldTech transfer token created. Copy it now; it is shown once only and remains active permanently.',
      token: rawToken,
      tokenId,
      expiresAt
    });
  } catch (err) { next(err); }
});

router.get('/dashboard/list', async (req, res, next) => {
  try {
    await DevTransferToken.updateMany(
      { developer: req.currentUser._id, allowedSystem: 'spworldtech', status: { $ne: 'active' } },
      { $set: { status: 'active' }, $unset: { revokedAt: '' } }
    );
    const tokens = await DevTransferToken.find({ developer: req.currentUser._id })
      .select('-tokenHash')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return res.json({ tokens });
  } catch (err) { next(err); }
});

router.post('/verify', requireInternalApiKey, async (req, res, next) => {
  try {
    const rawToken = req.body?.token;
    if (!rawToken) return res.status(400).json({ success: false, message: 'Token is required.' });
    const result = await findActiveToken(rawToken);
    if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });

    const available = await developerWalletAvailable();
    return res.json({
      success: true,
      message: 'Token verified.',
      developerId: String(result.token.developer),
      tokenId: result.token.tokenId,
      allowedSystem: result.token.allowedSystem,
      permissions: result.token.permissions,
      availableBalance: available,
      balance: available,
      currency: PLATFORM_CURRENCY,
      expiresAt: result.token.expiresAt
    });
  } catch (err) { next(err); }
});

router.post('/transfer', requireInternalApiKey, async (req, res, next) => {
  try {
    const rawToken = req.body?.token;
    const amount = moneyRound(req.body?.amount);
    if (!rawToken || !amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid token and amount are required.' });

    const result = await findActiveToken(rawToken);
    if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
    if (!result.token.permissions.includes('balance:transfer')) return res.status(403).json({ success: false, message: 'Token does not have transfer permission.' });

    const available = await developerWalletAvailable();
    if (amount > available) return res.status(400).json({ success: false, message: `Insufficient available balance. Available: ${PLATFORM_CURRENCY} ${available.toFixed(2)}.` });

    const reference = createReference();
    const withdrawal = await Withdrawal.create({
      staff: result.token.developer,
      walletType: 'developer',
      amount,
      currency: PLATFORM_CURRENCY,
      bankName: 'SP WorldTech Admin Wallet',
      accountNumber: 'AUTO-FORWARD',
      accountName: 'SP WorldTech Admin Dashboard',
      notes: `Auto-forwarded to SP WorldTech admin dashboard. Reference: ${reference}`,
      status: 'completed',
      processedBy: result.token.developer,
      processedAt: new Date()
    });

    await CrossPlatformTransferLog.create({
      fromSystem: 'tynasystems',
      toSystem: 'spworldtech',
      developer: result.token.developer,
      tokenId: result.token.tokenId,
      amount,
      currency: PLATFORM_CURRENCY,
      status: 'success',
      reference,
      reason: 'Approved developer wallet balance auto-forwarded to SP WorldTech admin wallet',
      metadata: { withdrawalId: String(withdrawal._id) }
    });

    return res.json({
      success: true,
      message: 'Balance released from Tyna Systems for SP WorldTech admin wallet.',
      amount,
      currency: PLATFORM_CURRENCY,
      reference,
      remainingBalance: await developerWalletAvailable()
    });
  } catch (err) { next(err); }
});

export default router;
