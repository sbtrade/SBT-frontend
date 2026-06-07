import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { 
  Users, 
  Activity, 
  Coins, 
  FileText, 
  AlertOctagon, 
  RefreshCw, 
  ShieldAlert, 
  UserX, 
  UserCheck 
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActiveUsers: 0,
    totalWalletBalance: 0.00,
    totalTransactions: 0,
    totalPendingRequests: 0,
    admin: null
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);

  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSuperData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/superadmin/stats');
      setStats(statsRes.data);

      const logsRes = await api.get('/superadmin/audit-logs');
      setAuditLogs(logsRes.data);

      const secRes = await api.get('/superadmin/security-events');
      setSecurityEvents(secRes.data);

      const adminsRes = await api.get('/superadmin/admins');
      setAdmins(adminsRes.data);
    } catch (err) {
      console.error('Fetch superadmin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChange = async (adminId) => {
    setSelectedAdminId(adminId);
    if (!adminId) {
      setAssignedUsers([]);
      return;
    }
    setUsersLoading(true);
    try {
      const res = await api.get(`/superadmin/users-by-admin/${adminId}`);
      setAssignedUsers(res.data);
    } catch (err) {
      console.error('Fetch assigned users error:', err);
      setError('Failed to fetch assigned users.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperData();
  }, []);

  useEffect(() => {
    if (selectedAdminId) {
      api.get(`/superadmin/users-by-admin/${selectedAdminId}`)
        .then(res => setAssignedUsers(res.data))
        .catch(err => console.error('Refresh assigned users error:', err));
    }
  }, [stats]);

  const handleAdminSuspension = async () => {
    if (!stats.admin) return;
    const isSuspended = stats.admin.status === 'SUSPENDED';
    const confirmMsg = isSuspended 
      ? 'Are you sure you want to restore the Admin account to ACTIVE status?' 
      : 'Are you sure you want to SUSPEND the Admin account? Suspended admins cannot authenticate or perform approvals.';
    
    if (!confirm(confirmMsg)) return;

    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      // Find Admin database ID from list
      const adminListRes = await api.get('/superadmin/admins');
      const adminAcc = adminListRes.data[0];

      if (!adminAcc) {
        setError('Admin account database record not found.');
        setActionLoading(false);
        return;
      }

      const res = await api.post('/superadmin/admins/suspend', {
        id: adminAcc.id,
        suspend: !isSuspended
      });

      setSuccess(res.data.message);
      fetchSuperData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update Admin status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(val || 0));
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-455 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 1. Statistics Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Users</span>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{stats.totalUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 text-slate-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Active Users</span>
            <h3 className="text-2xl font-extrabold text-teal-400 tracking-tight">{stats.totalActiveUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-500/5 border border-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">System Balance</span>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{formatMoney(stats.totalWalletBalance)}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 text-slate-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Transactions</span>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{stats.totalTransactions}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 text-slate-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pending Queue</span>
            <h3 className="text-2xl font-extrabold text-amber-400 tracking-tight">{stats.totalPendingRequests}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/5 border border-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Admin account suspension control section */}
      <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Admin Status Control</h4>
          <button
            onClick={fetchSuperData}
            className="p-2 rounded-xl bg-slate-950/20 border border-slate-900 text-slate-500 hover:text-white transition-all cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.admin ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-2xl gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase block">Active Administrator</span>
              <h5 className="text-sm font-bold text-slate-200">{stats.admin.fullname}</h5>
              <p className="text-xs text-slate-400 font-medium font-mono">{stats.admin.email} ({stats.admin.user_id})</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status Badge</span>
                <StatusBadge status={stats.admin.status} />
              </div>

              <button
                onClick={handleAdminSuspension}
                disabled={actionLoading}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] shadow-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  stats.admin.status === 'SUSPENDED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {stats.admin.status === 'SUSPENDED' ? (
                  <>
                    <UserCheck className="w-4.5 h-4.5" />
                    Activate Admin
                  </>
                ) : (
                  <>
                    <UserX className="w-4.5 h-4.5" />
                    Suspend Admin
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4 font-semibold">No Admin account seeded in system.</p>
        )}
      </div>

      {/* Customer Assignments Manager */}
      <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-4 mb-4 gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Customer Assignments Manager</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Select an administrator to audit their assigned customers.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedAdminId}
              onChange={(e) => handleAdminChange(e.target.value)}
              className="bg-[#020617] border border-slate-800 focus:border-teal-500 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer outline-none min-w-[200px]"
            >
              <option value="">-- Select Administrator (Manager) --</option>
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.fullname} ({adm.user_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedAdminId ? (
          usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">Customer User ID</th>
                    <th className="pb-3">Full Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Address</th>
                    <th className="pb-3 text-right">Wallet Balance</th>
                    <th className="pb-3 text-right px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-350 font-semibold">
                  {assignedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-semibold">
                        No customer accounts assigned to this administrator.
                      </td>
                    </tr>
                  ) : (
                    assignedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-450">{u.user_id}</td>
                        <td className="py-3.5 font-bold text-slate-200">{u.fullname}</td>
                        <td className="py-3.5 text-slate-400">{u.email}</td>
                        <td className="py-3.5 font-mono">{u.phone}</td>
                        <td className="py-3.5 text-slate-400 max-w-[150px] truncate" title={u.address}>
                          {u.address}
                        </td>
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
          )
        ) : (
          <div className="text-center py-8 text-slate-500 font-semibold text-xs border border-dashed border-slate-900/60 rounded-2xl bg-slate-950/20">
            Please select an administrator from the dropdown to view their assigned customers.
          </div>
        )}
      </div>

      {/* 3. Security logs and Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Security Alerts (left 1/3) */}
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Security Events</h4>
              <ShieldAlert className="w-4 h-4 text-rose-455" />
            </div>

            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {securityEvents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-medium">No critical security events logged.</p>
              ) : (
                securityEvents.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        evt.action === 'ACCOUNT_LOCKOUT' ? 'text-rose-400' : 'text-amber-400'
                      }`}>{evt.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{new Date(evt.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-350 font-semibold leading-relaxed text-[11px]">{evt.details}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900/40">
                      <span>Actor: {evt.actor_user_id || 'SYSTEM'}</span>
                      <span>IP: {evt.ip_address}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Full Audit Logs (right 2/3) */}
        <div className="lg:col-span-2 bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Audit Logs</h4>
              <span className="text-[9px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-xl uppercase tracking-wider">Audit Trail</span>
            </div>

            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-[#0a122c] z-10 pb-3">
                    <th className="pb-3 px-2">Actor</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">IP Address</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 text-right px-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500 font-medium">No audit logs recorded.</td></tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-200">{log.actor_user_id || 'SYSTEM'}</div>
                          <div className="text-[9px] font-mono text-slate-500 uppercase">
                            {log.actor_role === 'SUPER_ADMIN' ? 'SYSTEM AUDITOR' : log.actor_role}
                          </div>
                        </td>
                        <td className="py-3 font-bold text-[9px] uppercase tracking-wider text-slate-300">{log.action}</td>
                        <td className="py-3 font-mono text-slate-500">{log.ip_address}</td>
                        <td className="py-3 text-slate-350 max-w-[150px] truncate" title={log.details}>{log.details}</td>
                        <td className="py-3 text-right text-slate-500 px-2">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
