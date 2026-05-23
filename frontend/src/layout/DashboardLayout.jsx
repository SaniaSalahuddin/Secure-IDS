import React from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'

const DashboardLayout = ({children}) => {
  return (
    <div className='flex bg-slate-900 min-h-screen text-white'>
        <Sidebar/>
        <div className='flex-1'>
            <Navbar/>
            <div className='p-6'>
                {children}
            </div>
        </div>
      
    </div>
  )
}

export default DashboardLayout
