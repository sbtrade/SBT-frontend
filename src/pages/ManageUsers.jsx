import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Search, Users, RefreshCw, UserX, UserCheck, Trash2, Coins, FileText, Eye, AlertTriangle, ArrowRightLeft, HelpCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  let base = API_BASE_URL;
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanUrl}`;
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustAction, setAdjustAction] = useState('INCREASE');

  // KYC view states
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [userKyc, setUserKyc] = useState(null);
  const [kycError, setKycError] = useState('');

  // Transaction history states
  const [txHistoryOpen, setTxHistoryOpen] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [userTransactions, setUserTransactions] = useState([]);
  const [txError, setTxError] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

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

  const handleViewKyc = async (user) => {
    setSelectedUser(user);
    setKycError('');
    setUserKyc(null);
    setKycLoading(true);
    setKycModalOpen(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/kyc`);
      setUserKyc(res.data);
    } catch (err) {
      console.error('Fetch user KYC error:', err);
      setKycError(err.response?.data?.error || 'No KYC documents found for this user.');
    } finally {
      setKycLoading(false);
    }
  };

  const handleViewTransactions = async (user) => {
    setSelectedUser(user);
    setTxError('');
    setUserTransactions([]);
    setTxLoading(true);
    setTxHistoryOpen(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/transactions`);
      setUserTransactions(res.data);
    } catch (err) {
      console.error('Fetch user transactions error:', err);
      setTxError(err.response?.data?.error || 'Failed to load transaction ledger for this user.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleAdjustUserBalance = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/users/adjust-balance', {
        id: selectedUser.id,
        amount: adjustAmount,
        action: adjustAction
      });
      setSuccess(res.data.message);
      setAdjustModalOpen(false);
      setAdjustAmount('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust user wallet balance.');
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
                          onClick={() => handleViewKyc(u)}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-indigo-650/90 hover:bg-indigo-600 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          KYC
                        </button>
                        <button
                          onClick={() => handleViewTransactions(u)}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-400 rounded text-[10px] font-bold uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                          History
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setAdjustAmount(''); setAdjustAction('INCREASE'); setAdjustModalOpen(true); }}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-teal-655/90 hover:bg-teal-600 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5 shrink-0" />
                          Adjust
                        </button>
                        <button
                          onClick={() => handleSuspendUser(u.id, u.status === 'SUSPENDED')}
                          disabled={actionLoading}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            u.status === 'SUSPENDED'
                              ? 'bg-emerald-650/90 hover:bg-emerald-600 text-white'
                              : 'bg-amber-655/90 hover:bg-amber-600 text-white'
                          }`}
                        >
                          {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.user_id)}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-rose-655/90 hover:bg-rose-600 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
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

      {/* User Balance Adjustment Modal */}
      <Modal isOpen={adjustModalOpen} onClose={() => { setAdjustModalOpen(false); setSelectedUser(null); }} title="Adjust Customer Wallet Balance">
        {selectedUser && (
          <form onSubmit={handleAdjustUserBalance} className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Customer Details</span>
              <span className="block font-bold text-slate-200 text-sm">{selectedUser.fullname}</span>
              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">User ID: {selectedUser.user_id}</span>
              <span className="block font-mono text-[10px] text-teal-450 mt-0.5">Current Balance: {formatMoney(selectedUser.balance)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustAction('INCREASE')}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    adjustAction === 'INCREASE' 
                      ? 'bg-teal-950/20 border-teal-500/40 text-teal-400 font-bold' 
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Increase (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('DECREASE')}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    adjustAction === 'DECREASE' 
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-455 font-bold' 
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-rose-400'
                  }`}
                >
                  Decrease (Debit)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adjustment Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2.5 rounded-xl text-sm font-mono text-white"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className={`w-full py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all ${
                adjustAction === 'INCREASE' ? 'bg-teal-650 hover:bg-teal-600' : 'bg-rose-655 hover:bg-rose-600'
              }`}
            >
              {actionLoading ? 'Adjusting...' : 'Confirm Balance Adjustment'}
            </button>
          </form>
        )}
      </Modal>

      {/* User KYC View Modal */}
      <Modal isOpen={kycModalOpen} onClose={() => { setKycModalOpen(false); setSelectedUser(null); setUserKyc(null); }} title="Customer KYC Identification Documents">
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Customer Details</span>
              <span className="block font-bold text-slate-200 text-sm">{selectedUser.fullname}</span>
              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">User ID: {selectedUser.user_id}</span>
              <span className="block font-mono text-[10px] text-teal-450 mt-0.5">Email: {selectedUser.email}</span>
            </div>

            {kycLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : kycError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-350 text-xs font-semibold text-center leading-relaxed">
                {kycError}
              </div>
            ) : userKyc ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-350">Verification Status:</span>
                  <StatusBadge status={userKyc.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-450 uppercase block mb-1.5 text-center">Front side ID</span>
                    <div className="border border-slate-900 bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative p-1">
                      <img 
                        src={getFileUrl(userKyc.front_id_url)} 
                        alt="Front ID Document" 
                        className="max-h-full max-w-full rounded object-contain shadow"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center text-slate-500 text-[10px] font-semibold flex-col gap-1">
                        <AlertTriangle className="w-5 h-5 text-slate-600" />
                        Image loading failed
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-450 uppercase block mb-1.5 text-center">Back side ID</span>
                    <div className="border border-slate-900 bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative p-1">
                      <img 
                        src={getFileUrl(userKyc.back_id_url)} 
                        alt="Back ID Document" 
                        className="max-h-full max-w-full rounded object-contain shadow"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center text-slate-500 text-[10px] font-semibold flex-col gap-1">
                        <AlertTriangle className="w-5 h-5 text-slate-600" />
                        Image loading failed
                      </div>
                    </div>
                  </div>
                </div>

                {userKyc.remarks && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Assessor Remarks</span>
                    <p className="text-slate-350 font-semibold leading-relaxed font-mono">{userKyc.remarks}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-555 text-center py-4 font-semibold">No KYC record available.</p>
            )}
          </div>
        )}
      </Modal>

      {/* User Transaction Ledger Modal */}
      <Modal isOpen={txHistoryOpen} onClose={() => { setTxHistoryOpen(false); setSelectedUser(null); setUserTransactions([]); }} title="Customer Transaction Ledger">
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Customer Details</span>
              <span className="block font-bold text-slate-200 text-sm">{selectedUser.fullname}</span>
              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">User ID: {selectedUser.user_id}</span>
              <span className="block font-mono text-[10px] text-teal-450 mt-0.5">Current Balance: {formatMoney(selectedUser.balance)}</span>
            </div>

            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : txError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-350 text-xs font-semibold text-center leading-relaxed">
                {txError}
              </div>
            ) : userTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 font-semibold">No transaction records found for this user.</p>
            ) : (
              <div className="max-h-[350px] overflow-y-auto border border-slate-900 rounded-2xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/40 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5 text-right">Amount</th>
                      <th className="py-2.5 text-right">Status</th>
                      <th className="py-2.5 text-right px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40 text-slate-350 font-semibold">
                    {userTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-950/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-2.5 font-bold uppercase text-slate-200 text-[10px]">{tx.type}</td>
                        <td className={`py-2.5 text-right font-mono font-bold ${
                          tx.type === 'DEBIT' || tx.type === 'TRANSFER' || tx.type === 'WITHDRAWAL' ? 'text-rose-455' : 'text-teal-400'
                        }`}>
                          {tx.type === 'DEBIT' || tx.type === 'TRANSFER' || tx.type === 'WITHDRAWAL' ? '-' : '+'}
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="py-2.5 text-right">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="py-2.5 text-right px-3">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Transaction Details Receipt Modal */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Receipt">
        {selectedTx && (
          <div className="flex flex-col items-center py-4 space-y-6">
            
            {/* Logo */}
            <SbtLogo className="mb-1" />

            {/* Amount */}
            <div className="text-center space-y-1">
              <span className="text-3xl font-black text-white tracking-tight">
                {selectedTx.type === 'DEBIT' || selectedTx.type === 'TRANSFER' || selectedTx.type === 'WITHDRAWAL' ? '-' : '+'}
                {formatMoney(selectedTx.amount)}
              </span>
              {selectedTx.type === 'WITHDRAWAL' && selectedTx.btc_amount && (
                <span className="block text-xs font-mono text-slate-400 font-semibold">
                  ≈ -{parseFloat(selectedTx.btc_amount).toFixed(6)} BTC
                </span>
              )}
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {selectedTx.type}
              </span>
            </div>

            {/* Detail Card */}
            <div className="w-full bg-[#030712]/60 border border-slate-900 rounded-2xl p-5 space-y-4 shadow-inner">
              {/* Date */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Date</span>
                <span className="text-slate-200 font-bold">
                  {new Date(selectedTx.created_at).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  Status
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" title="Transaction state in database ledger" />
                </span>
                <div className="flex items-center">
                  <StatusBadge status={selectedTx.status} />
                </div>
              </div>

              {/* Recipient / Source */}
              <div className="flex justify-between items-start text-xs pt-3 border-t border-slate-900/60">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mt-0.5">
                  {selectedTx.type === 'DEPOSIT' || selectedTx.type === 'CREDIT' ? 'Source' : 'Recipient'}
                </span>
                <div className="text-right">
                  {selectedTx.type === 'TRANSFER' ? (
                    <div>
                      <span className="block text-slate-200 font-bold">
                        {selectedTx.receiver_id_str === 'EXTERNAL' ? 'External Recipient' : (selectedTx.receiver_id_str || 'External Address')}
                      </span>
                      {selectedTx.transaction_reference && (
                        <span className="block font-mono text-[9px] text-teal-450 select-all break-all mt-0.5" title="Copy recipient wallet address">
                          {selectedTx.transaction_reference}
                        </span>
                      )}
                    </div>
                  ) : selectedTx.type === 'WITHDRAWAL' ? (
                    <span className="block font-mono text-[10px] text-slate-400 break-all select-all">
                      {selectedTx.tx_hash ? `${selectedTx.tx_hash.substring(0, 12)}...${selectedTx.tx_hash.substring(selectedTx.tx_hash.length - 10)}` : 'Custody Address'}
                    </span>
                  ) : (
                    <span className="block text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      {selectedTx.payment_id || 'System Ledger'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="flex justify-between items-start text-xs pt-3 border-t border-slate-900/60">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Description</span>
                <span className="text-slate-400 font-normal max-w-[180px] text-right break-words">{selectedTx.description}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-all"
            >
              Close Receipt
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}

// Interlocking curved logo component with glow drawn in responsive SVG
const SbtLogo = ({ className = "w-16 h-16" }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <svg viewBox="0 0 100 100" className="w-16 h-16">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      
      {/* Central glowing circular area */}
      <circle cx="50" cy="50" r="16" fill="url(#glow)" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
      
      {/* Four interlocking curved arcs */}
      {/* Top arc */}
      <path d="M 50 20 A 30 30 0 0 1 80 50 A 4 4 0 0 1 72 50 A 22 22 0 0 0 50 28 A 4 4 0 0 1 50 20 Z" fill="url(#grad-teal)" />
      {/* Right arc */}
      <path d="M 80 50 A 30 30 0 0 1 50 80 A 4 4 0 0 1 50 72 A 22 22 0 0 0 72 50 A 4 4 0 0 1 80 50 Z" fill="url(#grad-blue)" transform="rotate(90 50 50)" />
      {/* Bottom arc */}
      <path d="M 50 80 A 30 30 0 0 1 20 50 A 4 4 0 0 1 28 50 A 22 22 0 0 0 50 72 A 4 4 0 0 1 50 80 Z" fill="url(#grad-teal)" transform="rotate(180 50 50)" />
      {/* Left arc */}
      <path d="M 20 50 A 30 30 0 0 1 50 20 A 4 4 0 0 1 50 28 A 22 22 0 0 0 28 50 A 4 4 0 0 1 20 50 Z" fill="url(#grad-blue)" transform="rotate(270 50 50)" />
    </svg>
    <span className="text-xl font-black tracking-widest text-[#38bdf8] mt-2 font-sans">SBT</span>
  </div>
);
