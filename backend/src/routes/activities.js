import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
const router=express.Router();
router.post('/',requireAuth,async(req,res)=>{const allowed=['dashboard_visit','download','checkout_attempt','support_action','purchase','contact_submission','booking_request','registration','login'];const {type,title,detail,metadata}=req.body;if(!allowed.includes(type))return res.status(400).json({message:'Invalid activity type'});await logActivity(req,{type,title,detail,metadata});res.status(201).json({message:'Activity recorded'});});
export default router;
