import React from 'react'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext)

  if (!user) {
    // Redirect to login page or show a message
    return <Navigate to='/'/>
  }

  return children;
}

export default ProtectedRoute;
