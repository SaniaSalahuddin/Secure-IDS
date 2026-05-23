import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { FaShieldAlt, FaUpload } from "react-icons/fa";
import DashboardLayout from "../layout/DashboardLayout";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold mb-2">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="text-slate-400 mb-10">
          Upload network traffic CSV files to detect intrusions and attack types.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-slate-300">Your role</h3>
            <p className="text-2xl font-bold text-cyan-500 mt-2 capitalize">
              {user?.role || "—"}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-slate-300">IDS model</h3>
            <p className="text-2xl font-bold text-green-400 mt-2 flex items-center gap-2">
              <FaShieldAlt /> Active
            </p>
          </div>

          <Link
            to="/upload"
            className="bg-cyan-500/20 border border-cyan-500/40 rounded-2xl p-6 hover:bg-cyan-500/30 transition flex flex-col justify-center"
          >
            <FaUpload className="text-cyan-400 text-2xl mb-3" />
            <h3 className="font-semibold text-white">Upload traffic</h3>
            <p className="text-slate-400 text-sm mt-1">Run detection on a CSV</p>
          </Link>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
