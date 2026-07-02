import express from 'express';
import SystemSetting from '../models/SystemSetting.js';
import { requireAuth, requireDeveloper } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

export async function getMaintenanceSetting() {
  const setting = await SystemSetting.findOne({ key: 'maintenance' });
  return setting?.value || { enabled: false, message: 'Tyna Systems is under professional maintenance. Please check back shortly.' };
}

router.get('/maintenance', async (req, res, next) => {
  try { res.json({ maintenance: await getMaintenanceSetting() }); } catch (err) { next(err); }
});

router.patch('/maintenance', requireAuth, requireDeveloper, async (req, res, next) => {
  try {
    const value = {
      enabled: Boolean(req.body.enabled),
      message: String(req.body.message || 'Tyna Systems is under professional maintenance. Please check back shortly.').trim(),
      updatedAt: new Date().toISOString()
    };
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'maintenance' },
      { value, updatedBy: req.currentUser._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await logActivity(req, { type: 'maintenance_mode', title: value.enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled', detail: value.message, metadata: value });
    res.json({ message: 'Maintenance mode updated.', maintenance: setting.value });
  } catch (err) { next(err); }
});

export default router;

