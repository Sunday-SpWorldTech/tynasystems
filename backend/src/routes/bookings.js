import express from 'express';
import Booking from '../models/Booking.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, company, businessType, message } = req.body;
    if (!name || !email || !company) return res.status(400).json({ message: 'Name, email and company are required' });

    await Booking.create({ name, email, company, businessType, message });
    await logActivity(req, { type: 'booking_request', name, email, title: 'Free setup call request', detail: `${name} from ${company} requested a setup call. ${message || ''}`.slice(0, 220), metadata: { company, businessType } });
    res.status(201).json({ message: 'Setup call request received. We will contact you with next steps.' });
  } catch (err) {
    next(err);
  }
});

export default router;

