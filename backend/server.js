import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import attackRoutes from "./routes/attackRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";


dotenv.config();

await connectDB();

const app=express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


const PORT=process.env.PORT || 70001;
app.use('/api/auth',authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/attacks',attackRoutes);
app.use('/api/users', userRoutes);
app.get('/',(req,res)=>{
    res.send("Backend is running");
})

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})