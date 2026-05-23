import Login from "./pages/Login.jsx";
import { Route,Routes } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import Upload from "./pages/Upload.jsx";
import Attacks from "./pages/Attacks.jsx";
import Users from "./pages/Users.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

function App() {
  return (
    <>
   <Toaster position="top-right"/>

    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      < Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard/>
        </ProtectedRoute>
      }/>
      <Route path="/upload" element={
        <ProtectedRoute>
          <Upload/>
        </ProtectedRoute>
      }/>
      <Route path="/attacks" element={
        <ProtectedRoute>
          <Attacks/>
        </ProtectedRoute>
      }/>
      <Route path="/users" element={
        <AdminRoute>
          <Users/>
        </AdminRoute>
      }/>
      <Route path="/verify-otp" element={<VerifyOtp />} />
    </Routes>
    </>
  )
}

export default App
