import express from 'express';
import crypto from 'crypto';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import WalletTransaction from '../models/WalletTransaction.js';
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

function productAmount(product) {
  if (PLATFORM_CURRENCY === 'USD') return moneyRound(product.priceUSD);
  return moneyRound(product.priceNGN);
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

router.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const { productSlug } = req.body;
    const email = req.user.email;
    const name = req.user.name;
    if (!productSlug) return res.status(400).json({ message: 'Product is required' });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const product = await getProduct(productSlug);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reference = `tyna_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const baseAmount = productAmount(product);
    if (!baseAmount || baseAmount <= 0) return res.status(400).json({ message: `Product price is not configured for ${PLATFORM_CURRENCY}` });
    const amount = customerChargeAmount(baseAmount);
    const amountSubunit = toSubunit(amount);

    await logActivity(req, { type: 'checkout_attempt', title: 'Checkout started', detail: `${name} started checkout for ${product.name || productSlug}.`, metadata: { productSlug, currency: PLATFORM_CURRENCY } });
    const order = await Order.create({
      user: req.user.id,
      email: email.toLowerCase().trim(),
      name,
      productSlug,
      amount,
      baseAmount,
      customerChargeAmount: amount,
      estimatedPaystackFee: estimatedPaystackFee(amount),
      currency: PLATFORM_CURRENCY,
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
        currency: PLATFORM_CURRENCY,
        reference,
        callback_url: dashboardCallbackUrl(),
        metadata: { name, productSlug, orderId: String(order._id), platformCurrency: PLATFORM_CURRENCY, checkoutTotal: amount }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ message: data.message || 'Payment service is currently unavailable. Please try again shortly.' });
    }

    res.json({ authorization_url: data.data.authorization_url, access_code: data.data.access_code, reference, currency: PLATFORM_CURRENCY, amount });
  } catch (err) {
    next(err);
  }
});



router.post('/project/initialize', async (req, res, next) => {
  try {
    const { clientName, clientEmail, projectCategory, projectType, projectTitle, notes, amountUSD, callbackPath } = req.body || {};
    const email = String(clientEmail || '').toLowerCase().trim();
    const name = String(clientName || '').trim();
    const category = String(projectCategory || 'Professional Services').trim();
    const type = String(projectType || 'Negotiated Project Payment').trim();
    const title = String(projectTitle || type || 'Tyna Systems Project Payment').trim();
    const baseAmount = cleanProjectAmount(amountUSD);

    if (!name) return res.status(400).json({ message: 'Client name is required.' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'A valid client email is required.' });
    if (!baseAmount || baseAmount < 1) return res.status(400).json({ message: 'Enter a valid USD payment amount.' });
    if (PLATFORM_CURRENCY !== 'USD') return res.status(400).json({ message: 'Project payments are configured for USD only. Set PLATFORM_CURRENCY=USD.' });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'Payment service is currently unavailable. Please try again shortly.' });

    const reference = `tyna_project_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amount = customerChargeAmount(baseAmount);
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
      customerChargeAmount: amount,
      estimatedPaystackFee: estimatedPaystackFee(amount),
      currency: PLATFORM_CURRENCY,
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
        currency: PLATFORM_CURRENCY,
        reference,
        callback_url: projectCallbackUrl(callbackPath),
        metadata: {
          name,
          projectCategory: category,
      projectType: type,
          projectTitle: title,
          orderId: String(order._id),
          platformCurrency: PLATFORM_CURRENCY,
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
      currency: PLATFORM_CURRENCY,
      amount
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
