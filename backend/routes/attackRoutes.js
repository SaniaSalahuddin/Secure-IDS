import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Attack from '../models/Attack.js';

const router=express.Router();

router.get('/',authMiddleware,async(req,res)=>{
    const attacks=await Attack.find()
    .populate("uploadedBy", "name email role").sort({ createdAt: -1 });

    res.json(attacks);
})
export default router;