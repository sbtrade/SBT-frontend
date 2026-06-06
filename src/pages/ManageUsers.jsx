import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { Search, Users, RefreshCw } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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
              className="bg-[#020617] border border-slate-800 focus:border-teal-500 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs w-60 font-semibold"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          </div>

          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 hover:text-white transition-all cursor-pointer"
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
                  <th className="pb-3 text-right px-2">Account status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-slate-350 font-semibold">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">No matching user records.</td>
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
                      <td className="py-3.5 text-right px-2">
                        <StatusBadge status={u.status} />
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
