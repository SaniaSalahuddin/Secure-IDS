import { useEffect, useState, useContext } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import api from "../api/client";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { FaTrash, FaSave } from "react-icons/fa";

function UsersPage() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleDraft, setRoleDraft] = useState({});

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data);
      const draft = {};
      res.data.forEach((u) => {
        draft[u._id] = u.role;
      });
      setRoleDraft(draft);
    } catch {
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (id, role) => {
    setRoleDraft((prev) => ({ ...prev, [id]: role }));
  };

  const saveRole = async (id) => {
    try {
      await api.patch(`/api/users/${id}/role`, { role: roleDraft[id] });
      toast.success("Role updated");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;

    try {
      await api.delete(`/api/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Manage users</h1>
        <p className="text-slate-400 mb-8">
          Admin only — change roles or remove accounts. Analysts can upload
          traffic; viewers can only view.
        </p>

        {loading ? (
          <p className="text-slate-400">Loading users...</p>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf =
                    currentUser?.userId &&
                    String(u._id) === String(currentUser.userId);

                  return (
                    <tr key={u._id} className="border-b border-slate-800">
                      <td className="p-4 font-medium">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-cyan-400">(you)</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={roleDraft[u._id] || u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={isSelf}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => saveRole(u._id)}
                            disabled={roleDraft[u._id] === u.role}
                            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 px-3 py-2 rounded-lg text-sm"
                          >
                            <FaSave /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(u._id, u.name)}
                            disabled={isSelf}
                            className="flex items-center gap-2 bg-red-500/80 hover:bg-red-600 disabled:opacity-40 px-3 py-2 rounded-lg text-sm"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
          <p className="font-semibold text-slate-300 mb-2">Role permissions</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Admin — full access + user management</li>
            <li>Analyst — upload CSV/Wireshark and view attack log</li>
            <li>Viewer — view dashboard and attack log only</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UsersPage;
