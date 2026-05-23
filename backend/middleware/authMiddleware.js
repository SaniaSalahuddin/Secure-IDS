import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

import User from "../models/User.js";
dotenv.config();
const authMiddleware=async(req,res,next)=>{
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }
    catch(error){
res.status(401).json({message:"Invalid token"});
    }
};
export default authMiddleware;