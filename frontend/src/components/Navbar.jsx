import React from 'react'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const Navbar = () => {
    const {user}=useContext(AuthContext);

  return (
    <div className='h-[80px] border border-b border-slate-800 flex items-center justify-between px-6 '>
        <div>
            <h1 className='text-2xl font-bold'>Intrusion Detection System</h1>
            <p className='text-slate-400 text-sm'>Real Time Threat Monitoring</p>

        </div>
        <div className='flex item-center gap-4'>
            <div className='text-right'>
                <h1 className='font-semibold'>{user?.name}</h1>
                <p className='text-cyan-400 text-sm'>{user?.role}</p>
            </div>
            <div className='w-12 h-12 flex items-center justify-center rounded-full bg-cyan-500 font-bold'>{user?.name?.charAt(0)}</div>
        </div>
      
    </div>
  )
}

export default Navbar
