import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import sendOtp from "../utils/sendOtp.js";


// ================= SIGNUP =================

export const signup = async (req, res) => {

    try {

        const { name, email, password, role } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// ================= LOGIN =================

export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Email not registered"
            });
        }

 console.log("INPUT PASSWORD:", JSON.stringify(password));
console.log("DB PASSWORD:", user.password);

const cleanPassword = password.trim();

console.log("CLEAN PASSWORD:", JSON.stringify(cleanPassword));

const isMatch = await bcrypt.compare(cleanPassword, user.password);

console.log("MATCH RESULT:", isMatch);
     

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password"
            });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        // Save OTP
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Send OTP
        console.log("OTP:", otp);

        // Uncomment later
        await sendOtp(user.email, otp);

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            email: user.email
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// ================= VERIFY OTP =================

export const verifyOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;

        // Check fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide OTP"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        // Check OTP
        if (String(user.otp) !== String(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Check Expiry
        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired"
            });
        }

        // Generate Token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Clear OTP
        user.otp = null;
        user.otpExpiry = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            userId: user._id,
            name: user.name,
            role: user.role
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};