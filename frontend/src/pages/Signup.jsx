import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { FaShieldAlt, FaLock, FaEnvelope, FaUser } from 'react-icons/fa'
import axios from 'axios'
import { motion } from 'framer-motion'

const Signup = () => {
    const[formData,setFormData]=useState({
        name:"",
        email:"",
        password:"",
        role:"viewer"
    })
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            const res=await axios.post("http://localhost:7000/api/auth/signup",formData)
            toast.success("Signup successful");
            console.log(res.data);
        }
        catch(error){
toast.error(error.response?.data?.message || "Signup Failed");
        }
    }
  return (
    <div className='bg-slate-950 min-h-screen flex items-center justify-center'>
        <motion.div
        initial={{opacity:0, y:50}}
        animate={{opacity:1, y:0}}
        transition={{duration:0.5}}
        className='w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 '
        >
            <div className='flex flex-col items-center mb-8'>
                <div className=' bg-cyan-500 p-4 rounded-full mb-4'>
                    <FaShieldAlt className='text-white text-3xl'/>
                </div>
                <h1 className='text-3xl font-bold text-white'>IDS SignUp</h1>
                <p className='text-slate-400 mt-2'>Intrusion Detection System</p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-5'>
                <div>
                    <label className='text-slate-300 block mb-2'>Name:</label>
                    <div className='bg-slate-800 flex items-center rounded-lg px-3'>
                        <FaUser className='text-slate-400 text-lg'/>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter Name"
                            onChange={handleChange}
                            className='w-full bg-transparent p-3 outline-none text-white'
                        />
                    </div>
                </div>
                <div>
                    <label className='text-slate-300 block mb-2'>Email:</label>
                    <div className='bg-slate-800 flex items-center rounded-lg px-3'>
                        <FaEnvelope className='text-slate-400 text-lg'/>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter Email"
                            onChange={handleChange}
                            className='w-full bg-transparent p-3 outline-none text-white'
                        />
                    </div>
                </div>
                <div>
                    <label className='text-slate-300 block mb-2'>Password:</label>
                    <div className='bg-slate-800 flex items-center rounded-lg px-3'>
                        <FaLock className='text-slate-400 text-lg'/>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter Password"
                            onChange={handleChange}
                            className='w-full bg-transparent p-3 outline-none text-white'
                        />
                    </div>
                    <div>
                        <label className='text-slate-300 block mb-2'>Role:</label>
                        <div className='bg-slate-800 flex items-center rounded-lg px-3'>
                            <select
                                name="role"
                                onChange={handleChange}
                                className='w-full bg-slate-800 p-3 outline-none text-white'
                            >
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                                <option value="analyst">System Analyst</option>
                            </select>
                        </div>
                        <button type="submit" className='bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-xl transition duration-300 mt-5 w-full '>
                            Sign Up
                        </button>
                    </div>
                    
                </div>
            </form>
<p className='text-slate-400 mt-8 text-center '>Already have an account? <Link to='/' className='text-cyan-500 hover:underline hover:text-cyan-400'>Login</Link></p>
        </motion.div>
     
    </div>
  )
}

export default Signup
