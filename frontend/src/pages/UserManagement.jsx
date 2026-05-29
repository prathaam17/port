import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Users2, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  CheckCircle,
  Key
} from 'lucide-react';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [usernameVal, setUsernameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [roleVal, setRoleVal] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      const rolesRes = await API.get('/users/roles');
      if (rolesRes.data && Array.isArray(rolesRes.data)) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !roleVal) {
          setRoleVal(rolesRes.data[0].id);
        }
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      triggerToast('Error', 'Failed to retrieve user directory lists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      fetchUsers();
    }
  }, [user]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!usernameVal || !emailVal || !passwordVal || !roleVal) {
      triggerToast('Validation Error', 'Please fill in all inputs.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await API.post('/users', {
        username: usernameVal,
        email: emailVal,
        password: passwordVal,
        roleId: roleVal
      });

      triggerToast('User Registered', `Account for ${usernameVal} created successfully.`, 'success');
      setShowAddModal(false);
      // Reset form
      setUsernameVal('');
      setEmailVal('');
      setPasswordVal('');
      setRoleVal(Array.isArray(roles) && roles.length > 0 ? roles[0].id : '');
      fetchUsers();
    } catch (error) {
      triggerToast('Creation Failed', error.response?.data?.message || 'Failed to create user.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openAddModal = () => {
    setUsernameVal('');
    setEmailVal('');
    setPasswordVal('');
    if (Array.isArray(roles) && roles.length > 0) {
      setRoleVal(roles[0].id);
    } else {
      setRoleVal('');
    }
    setShowAddModal(true);
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setRoleVal(u.roleId);
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await API.put(`/users/${selectedUser.id}`, {
        roleId: roleVal
      });

      const selectedRoleName = Array.isArray(roles) ? (roles.find(r => r.id === parseInt(roleVal))?.name || 'New Role') : 'New Role';
      triggerToast('User Updated', `Role for ${selectedUser.username} set to ${selectedRoleName}.`, 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      triggerToast('Edit Failed', error.response?.data?.message || 'Failed to edit role.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (name === user.username) {
      triggerToast('Action Blocked', 'You cannot terminate your own active session.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to terminate the credentials for ${name}?`)) return;

    try {
      await API.delete(`/users/${id}`);
      triggerToast('Account Revoked', `${name} has been removed from NMPA database.`, 'success');
      fetchUsers();
    } catch (error) {
      triggerToast('Revoke Failed', error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Operator Directory Registry</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Manage administrative credentials, adjust RBAC permissions, and review security access policies</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
        >
          <Plus className="w-4 h-4" />
          Add New Operator
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden glass-panel">
        
        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-500 dark:text-slate-450 font-light">No users logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm select-none">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                  <th className="p-4">Operator ID</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Operational Role</th>
                  <th className="p-4">Date Registered</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono text-slate-400">USR-{u.id}</td>
                    <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{u.username}</td>
                    <td className="p-4 font-medium">{u.email}</td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-0.5 text-sm font-bold bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded-md">
                        {u.Role?.name || u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right shrink-0">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 hover:bg-sky-500/10 text-sky-500 rounded-lg transition"
                          title="Edit User Role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition"
                          title="Revoke Credentials"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD NEW OPERATOR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Register Port Operator</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-sm select-none">
              
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. customs2"
                  value={usernameVal}
                  onChange={(e) => setUsernameVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. customs2@nmpa.gov.in"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Operator Role</label>
                <select
                  value={roleVal}
                  onChange={(e) => setRoleVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                >
                  {Array.isArray(roles) && roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-sky-500/10 flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitLoading ? 'Registering...' : 'Register Operator'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT OPERATOR ROLE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Modify Authorization Clearances</h3>
                <span className="text-sm text-slate-400 font-light">Operator: <strong className="text-sky-500">{selectedUser?.username}</strong></span>
              </div>
              <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4 text-sm select-none">
              
              {/* Role Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adjust Role Security Tier</label>
                <select
                  value={roleVal}
                  onChange={(e) => setRoleVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350 font-bold"
                >
                  {Array.isArray(roles) && roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-500 rounded-xl flex gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm leading-snug">
                  <strong>Access Policy Notice:</strong> Modifying an operator's role immediately takes effect on their active session. They will be limited or granted features based on their new security tier.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-sky-500/10 flex items-center gap-1"
                >
                  <Key className="w-4 h-4" />
                  {submitLoading ? 'Saving...' : 'Apply Role Adjustments'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
