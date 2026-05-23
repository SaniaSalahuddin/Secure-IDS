import React from 'react'
import {
    FaShieldAlt,
    FaUpload,
    FaUsers,
    FaBug,
    FaSignOutAlt,
    FaChartBar
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const Sidebar = () => {
    const {user,logout} =useContext(AuthContext);
  return (
    <div className='w-[260px] bg-slate-900 border border-r border-slate-800 p-5'>
        <div className='flex items-center gap-3 mb-5'>
            <FaShieldAlt className='text-cyan-400 text-3xl'/>
            <div>
                <h1 className='text-xl font-bold'>SecureIDS</h1>
<p className='text-slate-400 text-sm'>Detection System</p>

            </div>
        </div>
        <div className='space-y-3'>
            <Link to='/dashboard' className='flex item-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-all'>
            <FaChartBar/>
            Dashboard
            </Link>

             <Link to='/upload' className='flex item-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-all'>
            <FaUpload/>
            Upload Traffic
            </Link>

             <Link to='/attacks' className='flex item-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-all'>
            <FaBug/>
            Attack Log
            </Link>

            {
                user?.role==='admin' && (
                     <Link to='/users' className='flex item-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-all'>
            <FaUsers/>
            Manage Users
            </Link>
                )
            }

        </div>
        <button onClick={logout} className='w-full mt-10 flex items-center gap-3 bg-red-500 hover:bg-red-600 transition-all px-4 py-2 rounded-xl'><FaSignOutAlt/> Logout

        </button>
      
    </div>
  )
}

export default Sidebar
