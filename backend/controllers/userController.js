import User from "../models/User.js";

export const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password -otp -otpExpiry")
            .sort({ name: 1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const allowed = ["admin", "analyst", "viewer"];

        if (!allowed.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password -otp -otpExpiry");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Role updated", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.userId) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
