import express from 'express';
import Contact from '../models/Contact.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required' });

    await Contact.create({ name, email, subject, message, source: 'website' });
    await logActivity(req, { type: 'contact_submission', name, email, title: subject || 'Website contact form', detail: message.slice(0, 180) });
    res.status(201).json({ message: 'Message received. Tyna Systems will respond by email.' });
  } catch (err) {
    next(err);
  }
});

export default router;

