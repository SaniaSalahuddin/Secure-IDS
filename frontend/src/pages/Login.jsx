import React from 'react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { FaShieldAlt, FaLock, FaEnvelope } from 'react-icons/fa'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'


const Login = () => {
   
    const {login} =useContext(AuthContext);
 const [formData, setFormData]=useState({
    email:"",
    password:""
 })


  const handleChange = (e) => {
    
    // Handle login logic here
    setFormData({
        ...formData,
        [e.target.name]:e.target.value

    })
  }
 const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(
      "http://localhost:7000/api/auth/login",
      formData
    );

    toast.success(res.data.message); // OTP sent successfully

localStorage.setItem("email", res.data.email);
    navigate("/verify-otp");

  } catch (error) {
    toast.error(error.response?.data?.message || "Login Failed");
  }
};

  return (
    <div className='min-h-screen flex items-center bg-slate-950 justify-center'>
        <motion.div 
        initial={{opacity:0, y:50}}
        animate={{opacity:1, y:0}}
        transition={{duration:0.5}}
        className='bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-800'
>
<div className=' flex flex-col items-center mb-8'>
    <div className=' bg-cyan-500 p-4 rounded-full mb-4'>
        <FaShieldAlt className='text-white text-3xl'/>
    </div>
<h1 className='text-3xl font-bold text-white'>IDS System</h1>
<p className='text-slate-400 mt-2'>Intrusion Detection System</p>
    </div>

    <form onSubmit={handleSubmit} className='space-y-5'>
        <div>
            <label className='text-slate-300 block mb-3'>Email</label>
            <div className='bg-slate-800 rounded-lg flex items-center px-3'>
                <FaEnvelope className='text-slate-400 text-lg'/>
                <input type="email" name='email' placeholder='Enter Email' onChange={handleChange} className='w-full bg-transparent p-3 outline-none text-white' />

            </div>
        </div>
<div>
    <label className='text-slate-300 block mb-3'>Password</label>
    <div className='bg-slate-800 rounded-lg flex items-center px-3'>
        <FaLock className='text-slate-400 text-lg'/>
        <input type="password" name='password' placeholder='Enter Password' onChange={handleChange} className='w-full bg-transparent p-3 outline-none text-white' />
    </div>
</div>
<button className='w-full bg-cyan-500 hover:bg-cyan-600 transition-all font-semibold text-white rounded-xl py-2'>Login</button>
    </form>
              
              <p className='text-slate-400 mt-6 text-center'>
                Don't have an account? <Link to='/signup' className='text-cyan-500 hover:underline'>Sign Up</Link>

              </p>
        </motion.div>
      
    </div>
  )
}

export default Login
