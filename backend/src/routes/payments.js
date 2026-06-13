import express from 'express';
import crypto from 'crypto';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { fallbackProducts } from './products.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

async function getProduct(slug) {
  const saved = await Product.findOne({ slug, isActive: true });
  return saved || fallbackProducts.find((item) => item.slug === slug);
}

router.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const { productSlug } = req.body;
    const email = req.user.email;
    const name = req.user.name;
    if (!productSlug) return res.status(400).json({ message: 'Product is required' });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'PAYSTACK_SECRET_KEY is not configured' });

    const product = await getProduct(productSlug);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reference = `tyna_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amountNaira = Number(product.priceNGN);
    const amountKobo = amountNaira * 100;

    await logActivity(req, { type: 'checkout_attempt', title: 'Checkout started', detail: `${name} started checkout for ${product.name || productSlug}.`, metadata: { productSlug } });
    const order = await Order.create({
      user: req.user.id,
      email: email.toLowerCase().trim(),
      name,
      productSlug,
      amount: amountNaira,
      currency: 'NGN',
      reference,
      status: 'pending'
    });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
        metadata: { name, productSlug, orderId: String(order._id) }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ message: data.message || 'Unable to initialize Paystack payment' });
    }

    res.json({ authorization_url: data.data.authorization_url, access_code: data.data.access_code, reference });
  } catch (err) {
    next(err);
  }
});

router.get('/verify/:reference', async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ message: 'PAYSTACK_SECRET_KEY is not configured' });

    const { reference } = req.params;
    const order = await Order.findOne({ reference });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });

    const data = await response.json();
    if (data.status && data.data?.status === 'success') {
      order.status = 'paid';
      order.paystackData = data.data;
      await order.save();
      await logActivity(req, { type: 'purchase', user: order.user, name: order.name, email: order.email, title: 'Purchase completed', detail: `${order.email} paid for ${order.productSlug}.`, metadata: { reference: order.reference, amount: order.amount } });
      return res.json({ message: 'Payment verified. Demo access can now be delivered to this email.', order });
    }

    order.status = 'failed';
    order.paystackData = data.data || data;
    await order.save();
    res.status(400).json({ message: 'Payment was not successful', order });
  } catch (err) {
    next(err);
  }
});

export default router;
