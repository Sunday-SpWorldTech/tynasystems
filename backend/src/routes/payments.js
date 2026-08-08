import express from 'express';
import crypto from 'crypto';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import WalletTransaction from '../models/WalletTransaction.js';
import UserWalletTransaction from '../models/UserWalletTransaction.js';
import User from '../models/User.js';
import { fallbackProducts, normalizeProductPrice } from './products.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import {
  PLATFORM_CURRENCY,
  SYSTEMS_PAYMENT_CHARGE_DESCRIPTION,
  SYSTEMS_PAYMENT_CHARGE_PERCENT,
  systemsPaymentChargeAmount,
  companyNetAmount,
  customerChargeAmount,
  estimatedPaystackFee,
  moneyRound,
  toSubunit
} from '../utils/finance.js';

const router = express.Router();

async function getProduct(slug) {
  const saved = await Product.findOne({ slug, isActive: true });
  const product = saved || fallbackProducts.find((item) => item.slug === slug);
  return product ? normalizeProductPrice(product) : product;
}

function dashboardCallbackUrl() {
  const base = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';
  const fromEnv = process.env.PAYSTACK_CALLBACK_URL || '';
  if (fromEnv && !fromEnv.includes('demo-checkout.html')) return fromEnv;
  if (base) return `${base.replace(/\/$/, '')}/dashboard.html`;
  return fromEnv || undefined;
}

const DISPLAY_TO_USD_RATES = { USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79, CAD: 1.37, AUD: 1.52, GHS: 15.5, ZAR: 18.2, KES: 129, UGX: 3700, TZS: 2550, RWF: 1370, XOF: 610, XAF: 610, INR: 83.5, AED: 3.6725, SAR: 3.75, JPY: 157, CNY: 7.25, BRL: 5.45, MXN: 18.2 };

let exchangeRateCache = { expiresAt: 0, rates: DISPLAY_TO_USD_RATES, source: 'built-in' };

async function currentExchangeRates() {
  if (exchangeRateCache.expiresAt > Date.now()) return exchangeRateCache;
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Rate provider returned ${response.status}`);
    const data = await response.json();
    if (!data || !data.rates || data.result === 'error') throw new Error('Invalid rate response');
    exchangeRateCache = { expiresAt: Date.now() + 43200000, rates: { ...DISPLAY_TO_USD_RATES, ...data.rates, USD: 1 }, source: 'live' };
  } catch (error) {
    console.warn('Exchange-rate refresh failed; using cached/built-in rates:', error.message);
    exchangeRateCache = { ...exchangeRateCache, expiresAt: Date.now() + 3600000 };
  }
  return exchangeRateCache;
}

router.get('/exchange-rates', async (_req, res) => {
  const result = await currentExchangeRates();
  res.json({ base: 'USD', rates: result.rates, source: result.source, updatedAt: new Date().toISOString() });
});

function currencyRate(code = 'USD') {
  const currency = String(code || 'USD').toUpperCase();
  const envRate = Number(process.env[`FX_USD_${currency}`]);
  return Number.isFinite(envRate) && envRate > 0 ? envRate : (exchangeRateCache.rates[currency] || DISPLAY_TO_USD_RATES[currency] || 1);
}

function checkoutCurrency() {
  // Display currency and Paystack charge currency are intentionally separate.
  // Never send a visitor-selected currency unless the merchant has explicitly configured it.
  const configured = String(process.env.PAYSTACK_CHECKOUT_CURRENCY || 'NGN').toUpperCase();
  const enabled = String(process.env.PAYSTACK_SUPPORTED_CURRENCIES || configured).split(',').map(v => v.trim().toUpperCase()).filter(Boolean);
  return enabled.includes(configured) ? configured : (enabled[0] || 'NGN');
}

function convertUSD(amountUSD, currency) {
  return moneyRound(Number(amountUSD || 0) * currencyRate(currency));
}

function productAmount(product, currency) {
  if (currency === 'NGN' && Number(product.priceNGN) > 0) return moneyRound(product.priceNGN);
  return convertUSD(product.priceUSD, currency);
}


function projectCallbackUrl(callbackPath = 'dashboard.html#products') {
  const base = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';
  const fromEnv = process.env.PAYSTACK_PROJECT_CALLBACK_URL || '';
  if (fromEnv) return fromEnv;
  const safePath = String(callbackPath || 'dashboard.html#products').replace(/^\/+/, '');
  if (/^https?:\/\//i.test(safePath) || safePath.includes('..')) {
    return base ? `${base.replace(/\/$/, '')}/dashboard.html#products` : dashboardCallbackUrl();
  }
  if (base) return `${base.replace(/\/$/, '')}/${safePath}`;
  return dashboardCallbackUrl();
}

function cleanProjectAmount(value) {
  const amount = moneyRound(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return amount;
}

async function recordWalletCredits(order) {
  const systemsPaymentAmount = systemsPaymentChargeAmount(order.amount);
  const companyAmount = companyNetAmount(order.amount);
  order.systemsPaymentChargeAmount = systemsPaymentAmount;
  order.companyAmount = companyAmount;
  order.systemsPaymentChargeDescription = SYSTEMS_PAYMENT_CHARGE_DESCRIPTION;
  await order.save();

  await WalletTransaction.updateOne(
    { walletType: 'developer', reference: order.reference, description: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION },
    { $setOnInsert: { walletType: 'developer', order: order._id, reference: order.reference, amount: systemsPaymentAmount, currency: order.currency, type: 'credit', description: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION, metadata: { productSlug: order.productSlug, source: 'systems_payment_charge' } } },
    { upsert: true }
  );
  await WalletTransaction.updateOne(
    { walletType: 'company', reference: order.reference, description: 'Company sales wallet credit' },
    { $setOnInsert: { walletType: 'company', order: order._id, reference: order.reference, amount: companyAmount, currency: order.currency, type: 'credit', description: 'Company sales wallet credit', metadata: { productSlug: order.productSlug, source: 'company_sales_credit' } } },
    { upsert: true }
  );
}



function walletCallbackUrl() {
  const base = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';
  if (base) return `${base.replace(/\/$/, '')}/dashboard.html?wallet_deposit=1`;
  return dashboardCallbackUrl();
}

function validDepositAmount(value) {
  const amount = moneyRound(Number(value));
  return Number.isFinite(amount) && amount >= 100 ? amount : 0;
}


function walletLedgerBalance(transactions = []) {
  return moneyRound(transactions.reduce((total, tx) => {
    if (tx.status !== 'successful') return total;
    return tx.type === 'debit' ? total - Number(tx.amount || 0) : total + Number(tx.amount || 0);
  }, 0));
}

async function ensureWalletState(userId) {
  const currency = checkoutCurrency();
  let user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User account not found.'), { status: 404 });

  if (!user.walletLedgerInitialized || String(user.walletCurrency || '').toUpperCase() !== currency) {
    const transactions = await UserWalletTransaction.find({ user: userId }).lean();
    const balance = Math.max(0, walletLedgerBalance(transactions));
    const initialized = await User.findOneAndUpdate(
      { _id: userId, walletLedgerInitialized: { $ne: true } },
      { $set: { walletBalance: balance, walletCurrency: currency, walletLedgerInitialized: true } },
      { new: true }
    );
    user = initialized || await User.findById(userId);
    if (String(user.walletCurrency || '').toUpperCase() !== currency) {
      user.walletBalance = balance;
      user.walletCurrency = currency;
      user.walletLedgerInitialized = true;
      await user.save();
    }
  }
  return user;
}

async function creditUserWallet(userId, amount) {
  const value = moneyRound(amount);
  if (value <= 0) return ensureWalletState(userId);
  await ensureWalletState(userId);
  return User.findByIdAndUpdate(userId, { $inc: { walletBalance: value } }, { new: true });
}

async function debitUserWallet(userId, amount) {
  const value = moneyRound(amount);
  if (!Number.isFinite(value) || value <= 0) throw Object.assign(new Error('Enter a valid wallet payment amount.'), { status: 400 });
  const wallet = await ensureWalletState(userId);
  const currency = checkoutCurrency();
  const updated = await User.findOneAndUpdate(
    { _id: userId, walletLedgerInitialized: true, walletCurrency: currency, walletBalance: { $gte: value } },
    { $inc: { walletBalance: -value } },
    { new: true }
  );
  if (!updated) {
    const available = moneyRound(wallet.walletBalance || 0);
    throw Object.assign(new Error(`Insufficient wallet balance. Available balance is ${currency} ${available.toFixed(2)}.`), { status: 400 });
  }
  return updated;
}

async function refundUserWallet(userId, amount) {
  const value = moneyRound(amount);
  if (value > 0) await User.findByIdAndUpdate(userId, { $inc: { walletBalance: value } });
}

async function creditDeveloperDepositAllocation(deposit, userId) {
  const developerAllocationAmount = moneyRound(
    Number(deposit.developerAllocationAmount || systemsPaymentChargeAmount(deposit.amount))
  );
  if (developerAllocationAmount <= 0) return;

  await WalletTransaction.updateOne(
    { walletType: 'developer', reference: deposit.reference, description: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION },
    {
      $setOnInsert: {
        walletType: 'developer',
        reference: deposit.reference,
        amount: developerAllocationAmount,
        currency: deposit.currency,
        type: 'credit',
        description: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION,
        metadata: {
          source: 'wallet_deposit_allocation',
          userId: String(userId)
        }
      }
    },
    { upsert: true }
  );
}

router.get('/wallet', requireAuth, async (req, res, next) => {
  try {
    const walletUser = await ensureWalletState(req.user.id);
    const transactions = await UserWalletTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({
      wallet: {
        balance: moneyRound(Math.max(0, Number(walletUser.walletBalance || 0))),
        currency: String(walletUser.walletCurrency || checkoutCurrency()).toUpperCase(),
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/wallet/deposit/initialize', requireAuth, async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const depositedAmount = validDepositAmount(req.body.amount);
    if (!depositedAmount) return res.status(400).json({ message: 'Enter a valid deposit amount of at least 100.' });

    const currency = checkoutCurrency();
    const developerAllocationAmount = systemsPaymentChargeAmount(depositedAmount);
    const walletCreditAmount = moneyRound(depositedAmount - developerAllocationAmount);
    const chargedAmount = depositedAmount;
    const reference = `tyna_wallet_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await UserWalletTransaction.create({
      user: req.user.id,
      reference,
      amount: walletCreditAmount,
      chargedAmount,
      developerAllocationAmount,
      developerAllocationPercent: SYSTEMS_PAYMENT_CHARGE_PERCENT,
      currency,
      type: 'deposit',
      status: 'pending',
      description: 'Paystack wallet deposit'
    });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: req.user.email,
        amount: toSubunit(chargedAmount),
        currency,
        reference,
        callback_url: walletCallbackUrl(),
        metadata: {
          userId: req.user.id,
          purpose: 'user_wallet_deposit',
          depositedAmount,
          walletCreditAmount,
          developerAllocationAmount
        }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      await UserWalletTransaction.updateOne({ reference, user: req.user.id }, { status: 'failed', paystackData: data });
      return res.status(502).json({ message: data.message || 'Unable to start the wallet deposit.' });
    }

    await logActivity(req, {
      type: 'wallet_deposit_started',
      title: 'Wallet deposit started',
      detail: `${req.user.email} started a ${currency} ${depositedAmount.toFixed(2)} wallet deposit.`,
      metadata: { reference, depositedAmount, walletCreditAmount, currency }
    });

    res.json({ authorization_url: data.data.authorization_url, reference, amount: walletCreditAmount, chargedAmount, currency });
  } catch (err) {
    next(err);
  }
});

router.get('/wallet/deposit/verify/:reference', requireAuth, async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const deposit = await UserWalletTransaction.findOne({ reference: req.params.reference, user: req.user.id });
    if (!deposit) return res.status(404).json({ message: 'Wallet deposit not found.' });
    if (deposit.status === 'successful') {
      await ensureWalletState(req.user.id);
      await creditDeveloperDepositAllocation(deposit, req.user.id);
      return res.json({ message: 'Deposit already verified.', deposit });
    }

    // Initialize the cached wallet balance while this deposit is still pending,
    // so a first-time wallet cannot count the same verified deposit twice.
    await ensureWalletState(req.user.id);

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(deposit.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const data = await response.json();
    const paidCurrency = String(data.data?.currency || '').toUpperCase();
    const paidAmount = Number(data.data?.amount || 0);
    const expectedAmount = toSubunit(deposit.chargedAmount || deposit.amount);
    const metadataUserId = String(data.data?.metadata?.userId || '');

    if (data.status && data.data?.status === 'success' && paidCurrency === deposit.currency && paidAmount === expectedAmount && metadataUserId === req.user.id) {
      const wasSuccessful = deposit.status === 'successful';
      deposit.status = 'successful';
      deposit.paystackData = data.data;
      await deposit.save();

      if (!wasSuccessful) await creditUserWallet(req.user.id, deposit.amount);
      await creditDeveloperDepositAllocation(deposit, req.user.id);

      await logActivity(req, {
        type: 'wallet_deposit_completed',
        title: 'Wallet deposit completed',
        detail: `${req.user.email} deposited ${deposit.currency} ${Number(deposit.amount).toFixed(2)}.`,
        metadata: { reference: deposit.reference, amount: deposit.amount, currency: deposit.currency }
      });
      return res.json({ message: 'Deposit verified and added to your wallet.', deposit });
    }

    deposit.status = 'failed';
    deposit.paystackData = data.data || data;
    await deposit.save();
    return res.status(400).json({ message: 'Deposit verification failed or payment was not completed.' });
  } catch (err) {
    next(err);
  }
});


router.post('/wallet/purchase', requireAuth, async (req, res, next) => {
  let debitedAmount = 0;
  try {
    const { productSlug } = req.body || {};
    if (!productSlug) return res.status(400).json({ message: 'Product is required.' });
    const product = await getProduct(productSlug);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const existing = await Order.findOne({ user: req.user.id, productSlug, status: 'paid' });
    if (existing) return res.json({ message: 'You already own this product.', order: existing });

    await currentExchangeRates();
    const currency = checkoutCurrency();
    const amount = productAmount(product, currency);
    if (!amount || amount <= 0) return res.status(400).json({ message: `Product price is not configured for ${currency}.` });

    await debitUserWallet(req.user.id, amount);
    debitedAmount = amount;
    const reference = `tyna_wallet_purchase_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const usdBaseAmount = moneyRound(Number(product.priceUSD || 0));
    const order = await Order.create({
      user: req.user.id,
      email: req.user.email.toLowerCase().trim(),
      name: req.user.name,
      productSlug,
      amount,
      baseAmount: usdBaseAmount,
      baseCurrency: 'USD',
      displayCurrency: currency,
      displayAmount: amount,
      paymentCurrency: currency,
      paymentAmount: amount,
      exchangeRate: currencyRate(currency),
      exchangeRateTimestamp: new Date(),
      customerChargeAmount: amount,
      estimatedPaystackFee: 0,
      currency,
      reference,
      status: 'paid',
      paymentMethod: 'wallet',
      systemsPaymentChargeAmount: systemsPaymentChargeAmount(amount),
      companyAmount: companyNetAmount(amount),
      systemsPaymentChargeDescription: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION
    });

    await UserWalletTransaction.create({
      user: req.user.id,
      reference,
      amount,
      chargedAmount: amount,
      currency,
      type: 'debit',
      status: 'successful',
      description: `Product purchase: ${product.name || productSlug}`,
      metadata: { purpose: 'product_purchase', productSlug, orderId: String(order._id), paymentMethod: 'wallet' }
    });

    await recordWalletCredits(order);
    await logActivity(req, {
      type: 'purchase',
      title: 'Wallet purchase completed',
      detail: `${req.user.email} bought ${product.name || productSlug} with wallet balance.`,
      metadata: { reference, productSlug, amount, currency, paymentMethod: 'wallet' }
    });
    debitedAmount = 0;
    const walletUser = await User.findById(req.user.id).lean();
    return res.json({
      message: 'Purchase successful. Product access is now active.',
      order,
      wallet: { balance: moneyRound(walletUser?.walletBalance || 0), currency }
    });
  } catch (err) {
    if (debitedAmount > 0) await refundUserWallet(req.user.id, debitedAmount).catch(() => {});
    next(err);
  }
});

router.post('/wallet/pay-admin', requireAuth, async (req, res, next) => {
  let debitedAmount = 0;
  try {
    const amount = moneyRound(Number(req.body?.amount));
    const purpose = String(req.body?.purpose || 'Payment to Tyna Systems admin').trim().slice(0, 240);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Enter a valid payment amount.' });
    const currency = checkoutCurrency();

    await debitUserWallet(req.user.id, amount);
    debitedAmount = amount;
    const reference = `tyna_admin_wallet_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    await UserWalletTransaction.create({
      user: req.user.id,
      reference,
      amount,
      chargedAmount: amount,
      currency,
      type: 'debit',
      status: 'successful',
      description: `Admin payment: ${purpose}`,
      metadata: { purpose: 'admin_payment', note: purpose, recipient: 'Tyna Systems Admin' }
    });

    await WalletTransaction.create({
      walletType: 'company',
      reference,
      amount,
      currency,
      type: 'credit',
      description: 'User wallet payment to admin',
      metadata: { source: 'user_wallet_admin_payment', userId: String(req.user.id), userEmail: req.user.email, purpose }
    });

    await logActivity(req, {
      type: 'wallet_admin_payment',
      title: 'Wallet payment to admin',
      detail: `${req.user.email} paid ${currency} ${amount.toFixed(2)} to Tyna Systems admin from wallet balance.`,
      metadata: { reference, amount, currency, purpose }
    });
    debitedAmount = 0;
    const walletUser = await User.findById(req.user.id).lean();
    return res.json({
      message: 'Payment to admin completed successfully.',
      reference,
      wallet: { balance: moneyRound(walletUser?.walletBalance || 0), currency }
    });
  } catch (err) {
    if (debitedAmount > 0) await refundUserWallet(req.user.id, debitedAmount).catch(() => {});
    next(err);
  }
});

router.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const { productSlug, currency: requestedCurrency } = req.body;
    await currentExchangeRates();
    const email = req.user.email;
    const name = req.user.name;
    if (!productSlug) return res.status(400).json({ message: 'Product is required' });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const product = await getProduct(productSlug);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reference = `tyna_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const displayCurrency = String(requestedCurrency || 'USD').toUpperCase();
    const paymentCurrency = checkoutCurrency();
    const usdBaseAmount = moneyRound(Number(product.priceUSD || 0));
    const displayAmount = convertUSD(usdBaseAmount, displayCurrency);
    const baseAmount = productAmount(product, paymentCurrency);
    if (!baseAmount || baseAmount <= 0) return res.status(400).json({ message: `Product price is not configured for ${paymentCurrency}` });
    const amount = customerChargeAmount(baseAmount);
    const amountSubunit = toSubunit(amount);

    await logActivity(req, { type: 'checkout_attempt', title: 'Checkout started', detail: `${name} started checkout for ${product.name || productSlug}.`, metadata: { productSlug, currency: paymentCurrency, displayCurrency: requestedCurrency || 'USD' } });
    const order = await Order.create({
      user: req.user.id,
      email: email.toLowerCase().trim(),
      name,
      productSlug,
      amount,
      baseAmount: usdBaseAmount,
      baseCurrency: 'USD',
      displayCurrency,
      displayAmount,
      paymentCurrency,
      paymentAmount: amount,
      exchangeRate: currencyRate(displayCurrency),
      exchangeRateTimestamp: new Date(),
      customerChargeAmount: amount,
      estimatedPaystackFee: estimatedPaystackFee(amount),
      currency: paymentCurrency,
      reference,
      status: 'pending',
      paymentMethod: 'paystack',
      systemsPaymentChargeAmount: systemsPaymentChargeAmount(amount),
      companyAmount: companyNetAmount(amount),
      systemsPaymentChargeDescription: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION
    });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amountSubunit,
        currency: paymentCurrency,
        reference,
        callback_url: dashboardCallbackUrl(),
        metadata: { name, productSlug, orderId: String(order._id), baseCurrency: 'USD', baseAmount: usdBaseAmount, displayCurrency, displayAmount, paymentCurrency, checkoutTotal: amount }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ message: data.message || 'Payment service is currently unavailable. Please try again shortly.' });
    }

    res.json({ authorization_url: data.data.authorization_url, access_code: data.data.access_code, reference, baseCurrency: 'USD', baseAmount: usdBaseAmount, displayCurrency, displayAmount, notice: displayCurrency === 'USD' ? '' : 'Prices are shown in USD and your selected local-currency equivalent. Your bank may apply currency conversion during secure payment.' });
  } catch (err) {
    next(err);
  }
});



router.post('/project/initialize', async (req, res, next) => {
  try {
    const { clientName, clientEmail, projectCategory, projectType, projectTitle, notes, amountUSD, callbackPath, currency: requestedCurrency } = req.body || {};
    await currentExchangeRates();
    const email = String(clientEmail || '').toLowerCase().trim();
    const name = String(clientName || '').trim();
    const category = String(projectCategory || 'Professional Services').trim();
    const type = String(projectType || 'Negotiated Project Payment').trim();
    const title = String(projectTitle || type || 'Tyna Systems Project Payment').trim();
    const baseAmount = cleanProjectAmount(amountUSD);

    if (!name) return res.status(400).json({ message: 'Client name is required.' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'A valid client email is required.' });
    if (!baseAmount || baseAmount < 1) return res.status(400).json({ message: 'Enter a valid USD payment amount.' });
    
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const reference = `tyna_project_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const displayCurrency = String(requestedCurrency || 'USD').toUpperCase();
    const displayAmount = convertUSD(baseAmount, displayCurrency);
    const paymentCurrency = checkoutCurrency();
    const convertedBaseAmount = convertUSD(baseAmount, paymentCurrency);
    const amount = customerChargeAmount(convertedBaseAmount);
    const amountSubunit = toSubunit(amount);
    const order = await Order.create({
      email,
      name,
      productSlug: 'negotiated-project-payment',
      projectCategory: category,
      projectType: type,
      projectTitle: title,
      notes: String(notes || '').trim(),
      amount,
      baseAmount,
      baseCurrency: 'USD',
      displayCurrency,
      displayAmount,
      paymentCurrency,
      paymentAmount: amount,
      exchangeRate: currencyRate(displayCurrency),
      exchangeRateTimestamp: new Date(),
      customerChargeAmount: amount,
      estimatedPaystackFee: estimatedPaystackFee(amount),
      currency: paymentCurrency,
      reference,
      status: 'pending',
      systemsPaymentChargeAmount: systemsPaymentChargeAmount(amount),
      companyAmount: companyNetAmount(amount),
      systemsPaymentChargeDescription: SYSTEMS_PAYMENT_CHARGE_DESCRIPTION
    });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amountSubunit,
        currency: paymentCurrency,
        reference,
        callback_url: projectCallbackUrl(callbackPath),
        metadata: {
          name,
          projectCategory: category,
      projectType: type,
          projectTitle: title,
          orderId: String(order._id),
          baseCurrency: 'USD',
          baseAmount,
          displayCurrency,
          displayAmount,
          paymentCurrency,
          checkoutTotal: amount,
          source: callbackPath === 'tools.html#tools-payment' ? 'tools_page_notion_clickup_payment' : 'pricing_page_negotiated_project_payment'
        }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ message: data.message || 'Payment service is currently unavailable. Please try again shortly.' });
    }

    res.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference,
      baseCurrency: 'USD',
      baseAmount,
      displayCurrency,
      displayAmount,
      paymentCurrency,
      paymentAmount: amount,
      currency: paymentCurrency,
      amount,
      notice: displayCurrency === paymentCurrency ? '' : 'Your selected local-currency price remains visible. The secure payment page will show the final card charge before you approve payment.'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/verify/:reference', async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const { reference } = req.params;
    const order = await Order.findOne({ reference });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });

    const data = await response.json();
    const paidCurrency = String(data.data?.currency || order.currency || '').toUpperCase();
    const paidAmount = Number(data.data?.amount || 0);
    const expectedAmount = toSubunit(order.amount);
    if (data.status && data.data?.status === 'success' && paidCurrency === order.currency && paidAmount === expectedAmount) {
      order.status = 'paid';
      order.paystackData = data.data;
      await recordWalletCredits(order);
      await logActivity(req, { type: 'purchase', user: order.user, name: order.name, email: order.email, title: 'Payment completed', detail: `${order.email} paid ${order.currency} ${Number(order.amount).toFixed(2)}.`, metadata: { reference: order.reference, amount: order.amount, baseAmount: order.baseAmount, estimatedPaystackFee: order.estimatedPaystackFee, currency: order.currency } });
      return res.json({ message: 'Payment verified. Your product access is now active inside your dashboard.', order });
    }

    order.status = 'failed';
    order.paystackData = data.data || data;
    await order.save();
    res.status(400).json({ message: 'Payment was not successful or currency/amount verification failed', order });
  } catch (err) {
    next(err);
  }
});

export default router;
