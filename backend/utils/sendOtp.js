import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

const sendOtp = async (email, otp) => {
    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "OTP Verification",
            text: `Your OTP is ${otp}`
        });

        console.log("OTP sent via Resend");

    } catch (error) {
        console.log("Resend error:", error);
    }
};

export default sendOtp;