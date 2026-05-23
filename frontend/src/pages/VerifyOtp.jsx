import React from 'react'
import { useState, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

import OtpInput from 'react-otp-input'


const VerifyOtp = () => {
    const navigate=useNavigate();
    const [otp,setOtp]=useState("");
    const {login} =useContext(AuthContext);

   const handleVerify = async () => {
  try {
    const email = localStorage.getItem("email");

    const res = await axios.post(
      "http://localhost:7000/api/auth/verify-otp",
      {
        email,
        otp
      }
    );

    toast.success(res.data.message);
    login(res.data);

    navigate("/dashboard");

  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to verify OTP");
  }
};
      return (
    <div className='min-h-screen bg-slate-950 text-white flex items-center justify-center'>
        <div className='bg-slate-900 border border-slate-800 w-[400px] p-10 rounded-2xl'>
            <h1 className='text-2xl font-bold text-center mb-3 text-white'>Two Factor Authentication</h1>
<p className='text-center text-slate-400  mb-4'>Enter the 6-digit code sent to your email</p>

<div className='flex justify-center mb-8'>
    <OtpInput value={otp} onChange={setOtp} numInputs={6} 
    renderInput={(props)=> <input {...props} className='w-12 h-12 rounded-lg bg-slate-800 text-white text-center outline-none text-xl'/>}
    />
</div>
 <button
          onClick={handleVerify}
          className="w-full bg-cyan-500 hover:bg-cyan-600 transition-all p-3 rounded-lg text-white font-semibold"
        >
          Verify OTP
        </button>

        </div>
      
    </div>
  )
}

export default VerifyOtp
