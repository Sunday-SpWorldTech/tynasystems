import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
const uploadDir = path.resolve('uploads/products');
const imageUploadDir = path.resolve('frontend/assets/images/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(imageUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.query.type === 'image' || file.mimetype.startsWith('image/')) {
      cb(null, imageUploadDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const fallbackProducts = [
  {
    slug: 'backend-os-demo',
    name: 'Backend OS Demo',
    subtitle: 'Preview the operating system before full setup',
    description: 'Demo dashboard plus 15-minute walkthrough for founders who want to see the system first.',
    priceUSD: 7,
    priceNGN: 11200,
    deliveryType: 'digital',
    category: 'Demo',
    isActive: true,
    isFeatured: true
  },
  {
    slug: 'backend-os-template',
    name: 'Backend OS Full Template',
    subtitle: 'DIY operating system template',
    description: 'Full DIY operating system template for operations, finance, projects, SOPs and reporting.',
    priceUSD: 149,
    priceNGN: 238400,
    deliveryType: 'digital',
    category: 'Template',
    isActive: true,
    isFeatured: true
  },
  {
    slug: 'done-for-you-build',
    name: 'Done-For-You Backend OS Build',
    subtitle: 'Implementation for serious founders',
    description: 'A full implementation project for your business operations with setup and handover.',
    priceUSD: 699,
    priceNGN: 1118400,
    deliveryType: 'service',
    category: 'Implementation',
    isActive: true,
    isFeatured: true
  }
];

function makeSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ products: products.length ? products : fallbackProducts });
  } catch (err) { next(err); }
});

router.get('/dashboard/my-products', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ email: req.user.email, status: 'paid' }).populate('product').sort({ createdAt: -1 });
    const productSlugs = [...new Set(orders.map((o) => o.productSlug))];
    const products = await Product.find({ slug: { $in: productSlugs }, isActive: true });
    res.json({ orders, products });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    const fallback = fallbackProducts.find((item) => item.slug === req.params.slug);
    if (!product && !fallback) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: product || fallback });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { name, slug, subtitle, description, category, priceUSD, priceNGN, deliveryType, downloadUrl, fileUrl, imageUrl, youtubeUrl, tags, isFeatured, isActive } = req.body;
    if (!name || priceUSD === undefined || priceNGN === undefined) return res.status(400).json({ message: 'Name, priceUSD and priceNGN are required' });
    const finalSlug = slug ? makeSlug(slug) : makeSlug(name);
    const product = await Product.create({
      name, slug: finalSlug, subtitle, description, category,
      priceUSD: Number(priceUSD), priceNGN: Number(priceNGN), deliveryType,
      downloadUrl, fileUrl, imageUrl, youtubeUrl,
      tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      isFeatured: Boolean(isFeatured), isActive: isActive !== false, createdBy: req.user.id
    });
    await logActivity(req, { type: 'staff_action', title: 'Product created', detail: `${req.user.name || 'Staff'} created product ${product.name}.`, metadata: { productSlug: product.slug } });
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Product slug already exists' });
    next(err);
  }
});

router.put('/:id', requireAuth, requireStaff, async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.slug) data.slug = makeSlug(data.slug);
    if (data.priceUSD !== undefined) data.priceUSD = Number(data.priceUSD);
    if (data.priceNGN !== undefined) data.priceNGN = Number(data.priceNGN);
    if (data.tags && !Array.isArray(data.tags)) data.tags = String(data.tags).split(',').map((t) => t.trim()).filter(Boolean);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await logActivity(req, { type: 'staff_action', title: 'Product updated', detail: `${req.user.name || 'Staff'} updated product ${product.name}.`, metadata: { productSlug: product.slug } });
    res.json({ message: 'Product updated', product });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireStaff, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await logActivity(req, { type: 'staff_action', title: 'Product hidden', detail: `${req.user.name || 'Staff'} hid product ${product.name}.`, metadata: { productSlug: product.slug } });
    res.json({ message: 'Product hidden from users', product });
  } catch (err) { next(err); }
});

router.post('/upload', requireAuth, requireStaff, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  const isImage = req.query.type === 'image' || req.file.mimetype.startsWith('image/');
  const publicPath = isImage 
    ? `/assets/images/uploads/${req.file.filename}`
    : `/uploads/products/${req.file.filename}`;
    
  await logActivity(req, { type: 'staff_action', title: isImage ? 'Image uploaded' : 'Product file uploaded', detail: `${req.user.name || 'Staff'} uploaded ${req.file.originalname}.`, metadata: { fileUrl: publicPath } });
  res.status(201).json({ message: 'File uploaded', fileUrl: publicPath, filename: req.file.filename });
});

export default router;
export { fallbackProducts };
