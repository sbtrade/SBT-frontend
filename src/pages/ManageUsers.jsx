import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { Search, Users, RefreshCw, UserX, UserCheck, Trash2 } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuspendUser = async (id, isSuspended) => {
    const confirmMsg = isSuspended
      ? 'Are you sure you want to restore this user account to ACTIVE status?'
      : 'Are you sure you want to SUSPEND this user account? Suspended users cannot authenticate or perform transfers.';
    if (!confirm(confirmMsg)) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/users/suspend', { id, suspend: !isSuspended });
      setSuccess(res.data.message);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id, userIdStr) => {
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY DELETE user account ${userIdStr}? This action is irreversible, and will delete their wallet and history.`)) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/users/delete', { id });
      setSuccess(res.data.message);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullname.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(val || 0));
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold animate-fadeIn">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-350 text-xs font-semibold animate-fadeIn">
          {error}
        </div>
      )}

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 text-slate-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Registered Users Database</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Comprehensive audit ledger of customer profiles.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ID, Name or Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#020617] border border-slate-800 focus:border-teal-500 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs w-60 font-semibold outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          </div>

          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 hover:text-white transition-all cursor-pointer outline-none"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-2">User ID</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Address</th>
                  <th className="pb-3 text-right">Wallet Balance</th>
                  <th className="pb-3 text-right">Account status</th>
                  <th className="pb-3 text-right px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-slate-350 font-semibold">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">No matching user records.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-950/10 transition-colors">
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-450">{u.user_id}</td>
                      <td className="py-3.5 font-bold text-slate-200">{u.fullname}</td>
                      <td className="py-3.5 text-slate-400">{u.email}</td>
                      <td className="py-3.5 font-mono">{u.phone}</td>
                      <td className="py-3.5 text-slate-400 max-w-[150px] truncate" title={u.address}>{u.address}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-teal-400">{formatMoney(u.balance)}</td>
                      <td className="py-3.5 text-right">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="py-3.5 text-right px-2 space-x-2 shrink-0">
                        <button
                          onClick={() => handleSuspendUser(u.id, u.status === 'SUSPENDED')}
                          disabled={actionLoading}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            u.status === 'SUSPENDED'
                              ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white'
                              : 'bg-amber-600/90 hover:bg-amber-500 text-white'
                          }`}
                        >
                          {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.user_id)}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
