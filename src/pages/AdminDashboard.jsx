import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { 
  Users, 
  UserCheck, 
  Landmark, 
  ArrowRightLeft, 
  Download, 
  KeyRound, 
  Wallet, 
  Plus, 
  Eye,
  AlertTriangle,
  Coins,
  Copy,
  Check
} from 'lucide-react';

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

export default function AdminDashboard() {
  const [adminWallet, setAdminWallet] = useState({ balance: '0.00', total_credits: '0.00', total_debits: '0.00' });
  
  // Queues lists
  const [registrations, setRegistrations] = useState([]);
  const [kycs, setKycs] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [resets, setResets] = useState([]);
  const [users, setUsers] = useState([]);

  // Active queue tab state
  const [activeTab, setActiveTab] = useState('registrations');

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal control states
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [adjustAction, setAdjustAction] = useState('INCREASE'); // 'INCREASE' or 'DECREASE'

  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const [kycReviewOpen, setKycReviewOpen] = useState(false);
  const [activeKyc, setActiveKyc] = useState(null);
  const [kycRemarks, setKycRemarks] = useState('');

  const [custodySuccessOpen, setCustodySuccessOpen] = useState(false);
  const [custodyTxDetails, setCustodyTxDetails] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyAddress = (address, reqId) => {
    navigator.clipboard.writeText(address);
    setCopiedId(reqId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const wRes = await api.get('/admin/wallet');
      setAdminWallet(wRes.data);

      const regRes = await api.get('/admin/registrations');
      setRegistrations(regRes.data);

      const kycRes = await api.get('/admin/kyc');
      setKycs(kycRes.data);

      const fundRes = await api.get('/admin/fund-requests');
      setFundRequests(fundRes.data);

      const txRes = await api.get('/admin/transfer-requests');
      setTransfers(txRes.data);

      const wdRes = await api.get('/admin/withdrawal-requests');
      setWithdrawals(wdRes.data);

      const rRes = await api.get('/admin/password-resets');
      setResets(rRes.data);

      const uRes = await api.get('/admin/users');
      setUsers(uRes.data);

    } catch (err) {
      console.error('Fetch queues error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const handleAdminWalletAdjustment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/wallet/adjust', { amount: depositAmount, action: adjustAction });
      setSuccess(res.data.message);
      setDepositAmount('');
      setDepositOpen(false);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust wallet balance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRegistration = async (userId) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/registrations/approve', { id: userId });
      setCredentials(res.data.credentials);
      setCredentialsOpen(true);
      setSuccess(res.data.message);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRegistration = async (userId) => {
    if (!confirm('Are you sure you want to reject this registration?')) return;
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/registrations/reject', { id: userId });
      setSuccess(res.data.message);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const openKycReview = (kyc) => {
    setActiveKyc(kyc);
    setKycRemarks('');
    setKycReviewOpen(true);
  };

  const handleKycDecision = async (approved) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    const endpoint = approved ? '/admin/kyc/approve' : '/admin/kyc/reject';
    try {
      const res = await api.post(endpoint, { id: activeKyc.id, remarks: kycRemarks });
      setSuccess(res.data.message);
      setKycReviewOpen(false);
      setActiveKyc(null);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process KYC request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFundDecision = async (id, approved, remarks = '') => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    const endpoint = approved ? '/admin/fund-requests/approve' : '/admin/fund-requests/reject';
    try {
      const res = await api.post(endpoint, { id, admin_remarks: remarks || (approved ? 'Approved' : 'Rejected') });
      setSuccess(res.data.message);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process fund request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferDecision = async (id, approved) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    const endpoint = approved ? '/admin/transfer-requests/approve' : '/admin/transfer-requests/reject';
    try {
      const res = await api.post(endpoint, { id });
      setSuccess(res.data.message);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process transfer request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawalDecision = async (id, approved) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    
    if (approved) {
      try {
        const res = await api.post('/admin/withdrawal-requests/approve', { id });
        setCustodyTxDetails(res.data);
        setCustodySuccessOpen(true);
        setSuccess(res.data.message);
        fetchQueues();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to approve withdrawal.');
      } finally {
        setActionLoading(false);
      }
    } else {
      if (!confirm('Are you sure you want to reject this withdrawal?')) return;
      try {
        const res = await api.post('/admin/withdrawal-requests/reject', { id });
        setSuccess(res.data.message);
        fetchQueues();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to reject withdrawal.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleResetApproval = async (id) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/password-resets/approve', { id });
      setCredentials(res.data.credentials);
      setCredentialsOpen(true);
      setSuccess(res.data.message);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve reset.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetRejection = async (id) => {
    if (!confirm('Are you sure you want to reject this password reset request?')) return;
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/password-resets/reject', { id });
      setSuccess(res.data.message);
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject reset request.');
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

      {/* 1. Stats Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 relative overflow-hidden shadow-lg lg:col-span-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-455">
                <Wallet className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest block">Admin Master Wallet Balance</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatMoney(adminWallet.balance)}</h3>
              <span className="text-[10px] text-slate-500 font-semibold block">Total Deposits: {formatMoney(adminWallet.total_credits)} | Total Disbursed: {formatMoney(adminWallet.total_debits)}</span>
            </div>

            <button
              onClick={() => { setDepositOpen(true); setAdjustAction('INCREASE'); }}
              className="px-4 py-2.5 bg-teal-650 hover:bg-teal-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 border border-teal-500/20"
            >
              <Coins className="w-4 h-4 text-teal-450 shrink-0" />
              Adjust Balance
            </button>
          </div>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <div>
            <div className="flex items-center gap-2 text-teal-455">
              <Users className="w-4.5 h-4.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest block">User Statistics</span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mt-2">{users.length}</h3>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              Active: {users.filter(u => u.status === 'ACTIVE').length} | Suspended: {users.filter(u => u.status === 'SUSPENDED').length}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-4">
            Total active customer profiles registered
          </div>
        </div>
      </div>

      {/* 2. Count Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Signups', count: registrations.length, type: 'registrations', icon: Users },
          { label: 'KYC Reviews', count: kycs.length, type: 'kyc', icon: UserCheck },
          { label: 'Fund Reqs', count: fundRequests.length, type: 'funds', icon: Landmark },
          { label: 'Transfers', count: transfers.length, type: 'transfers', icon: ArrowRightLeft },
          { label: 'Withdrawals', count: withdrawals.length, type: 'withdrawals', icon: Download },
          { label: 'Resets', count: resets.length, type: 'resets', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
                activeTab === tab.type
                  ? 'bg-teal-950/20 border-teal-500/30 text-teal-400 font-bold scale-[1.02]'
                  : 'bg-[#0a122c] border-slate-900 text-slate-450 hover:text-white hover:border-slate-800'
              }`}
            >
              <Icon className="w-4.5 h-4.5 mb-1.5 shrink-0" />
              <span className="text-[9px] uppercase tracking-wider block font-semibold">{tab.label}</span>
              <span className="text-lg font-black tracking-tight block mt-1">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Queue Details */}
      <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {activeTab === 'registrations' && 'Pending User Registrations'}
            {activeTab === 'kyc' && 'Pending KYC Verifications'}
            {activeTab === 'funds' && 'Pending Fund Allocation Requests'}
            {activeTab === 'transfers' && 'Pending User Transfers'}
            {activeTab === 'withdrawals' && 'Pending Bitcoin Withdrawals (Custody Pipeline)'}
            {activeTab === 'resets' && 'Pending Password Reset Requests (Subsequent Forgot Password)'}
          </h4>
          <span className="text-[9px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-xl uppercase tracking-wider">
            Approvals Queue
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* REGISTRATIONS QUEUE */}
            {activeTab === 'registrations' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Address</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {registrations.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-500">No pending registrations.</td></tr>
                  ) : (
                    registrations.map(r => (
                      <tr key={r.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2 font-bold text-slate-250">{r.fullname}</td>
                        <td className="py-3.5 text-slate-400">{r.email}</td>
                        <td className="py-3.5 font-mono">{r.phone}</td>
                        <td className="py-3.5 text-slate-400 max-w-[150px] truncate">{r.address}</td>
                        <td className="py-3.5 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right px-2 space-x-2 shrink-0">
                          <button
                            onClick={() => handleApproveRegistration(r.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRegistration(r.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* KYC QUEUE */}
            {activeTab === 'kyc' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {kycs.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-500">No pending KYC documents.</td></tr>
                  ) : (
                    kycs.map(k => (
                      <tr key={k.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-450">{k.user_id}</td>
                        <td className="py-3.5 font-bold text-slate-250">{k.fullname}</td>
                        <td className="py-3.5 text-slate-500">{new Date(k.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right px-2">
                          <button
                            onClick={() => openKycReview(k)}
                            className="px-2.5 py-1 bg-teal-650 hover:bg-teal-555 text-white rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* FUNDS QUEUE */}
            {activeTab === 'funds' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Remarks</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {fundRequests.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-500">No pending fund requests.</td></tr>
                  ) : (
                    fundRequests.map(f => (
                      <tr key={f.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-450">{f.user_id}</td>
                        <td className="py-3.5 text-slate-200">{f.fullname}</td>
                        <td className="py-3.5 text-right font-mono font-bold text-teal-400">{formatMoney(f.amount)}</td>
                        <td className="py-3.5 text-slate-400 max-w-[120px] truncate">{f.remarks || '-'}</td>
                        <td className="py-3.5 text-slate-500">{new Date(f.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right px-2 space-x-2">
                          <button
                            onClick={() => handleFundDecision(f.id, true)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleFundDecision(f.id, false)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* TRANSFERS QUEUE */}
            {activeTab === 'transfers' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">Sender</th>
                    <th className="pb-3">Receiver ID / Address</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {transfers.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">No pending transfers.</td></tr>
                  ) : (
                    transfers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2">
                          <div className="font-bold text-slate-200">{t.sender_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{t.sender_user_id}</div>
                        </td>
                        <td className="py-3.5 font-mono">
                          <div className="flex items-center gap-2">
                            {t.receiver_user_id === 'EXTERNAL' ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                EXTERNAL
                              </span>
                            ) : (
                              <span className="uppercase text-slate-200 font-bold shrink-0">User: {t.receiver_user_id}</span>
                            )}
                          </div>
                          {t.receiver_wallet_address ? (
                            <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[10px] text-slate-350 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-900 w-fit">
                              <span className="select-all break-all">{t.receiver_wallet_address}</span>
                              <button
                                onClick={() => handleCopyAddress(t.receiver_wallet_address, t.id)}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-all shrink-0 ml-1"
                                title="Copy recipient wallet address"
                              >
                                {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic block mt-1">No wallet address recorded</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-teal-400">{formatMoney(t.amount)}</td>
                        <td className="py-3.5 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right px-2 space-x-2">
                          <button
                            onClick={() => handleTransferDecision(t.id, true)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-600 text-white border border-emerald-500/20 rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleTransferDecision(t.id, false)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-655 hover:bg-rose-600 text-white border border-rose-500/20 rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* WITHDRAWALS QUEUE (Bitcoin addresses) */}
            {activeTab === 'withdrawals' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Bitcoin Destination Address</th>
                    <th className="pb-3 text-right">USD Value</th>
                    <th className="pb-3 text-right">BTC Net</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right px-2">Custody Release</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-500">No pending withdrawals.</td></tr>
                  ) : (
                    withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-450">{w.user_id}</td>
                        <td className="py-3.5 text-slate-200">{w.fullname}</td>
                        <td className="py-3.5 font-mono text-slate-450 select-all" title={w.btc_address}>{w.btc_address}</td>
                        <td className="py-3.5 text-right font-mono text-slate-250">{formatMoney(w.amount)}</td>
                        <td className="py-3.5 text-right font-mono text-teal-400 font-bold">{parseFloat(w.btc_amount).toFixed(6)} BTC</td>
                        <td className="py-3.5 text-slate-500">{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right px-2 space-x-2">
                          <button
                            onClick={() => handleWithdrawalDecision(w.id, true)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Release BTC
                          </button>
                          <button
                            onClick={() => handleWithdrawalDecision(w.id, false)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* RESETS QUEUE */}
            {activeTab === 'resets' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">User ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Contact Email</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-300 font-semibold">
                  {resets.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-500">No pending password reset requests.</td></tr>
                  ) : (
                    resets.map(r => (
                      <tr key={r.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-455">{r.user_id}</td>
                        <td className="py-3.5 text-slate-200 font-bold">{r.fullname}</td>
                        <td className="py-3.5 text-slate-400">{r.email}</td>
                        <td className="py-3.5 font-mono">{r.phone}</td>
                        <td className="py-3.5 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right px-2 space-x-2">
                          <button
                            onClick={() => handleResetApproval(r.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Approve Reset
                          </button>
                          <button
                            onClick={() => handleResetRejection(r.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Admin Adjust Master Wallet Balance */}
      <Modal isOpen={depositOpen} onClose={() => setDepositOpen(false)} title="Adjust Master Wallet Balance">
        <form onSubmit={handleAdminWalletAdjustment} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustAction('INCREASE')}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  adjustAction === 'INCREASE' 
                    ? 'bg-teal-950/20 border-teal-500/40 text-teal-400 font-bold' 
                    : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                }`}
              >
                Increase (Deposit)
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
                Decrease (Withdraw)
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
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
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
      </Modal>

      {/* MODAL 2: Credentials Display */}
      <Modal isOpen={credentialsOpen} onClose={() => { setCredentialsOpen(false); setCredentials(null); }} title="Generated User Credentials">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold text-slate-350">
              Account credentials generated successfully. Provide these credentials to the user.
            </p>
          </div>

          {credentials?.user_id && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">User ID / Username</span>
              <div className="bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-xl font-mono text-sm font-bold text-white select-all">
                {credentials.user_id}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Temporary Password</span>
            <div className="bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-xl font-mono text-sm font-bold text-teal-400 tracking-wider select-all">
              {credentials?.temporary_password}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              Note: This temporary password is valid for the first login only. The user will be required to change it on access.
            </p>
          </div>

          <button
            onClick={() => { setCredentialsOpen(false); setCredentials(null); }}
            className="w-full py-2.5 bg-teal-650 hover:bg-teal-555 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
          >
            Finished
          </button>
        </div>
      </Modal>

      {/* MODAL 3: KYC Reviews */}
      <Modal isOpen={kycReviewOpen} onClose={() => { setKycReviewOpen(false); setActiveKyc(null); }} title="KYC Verification Review">
        {activeKyc && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">Front ID Document</span>
                <a 
                  href={getFileUrl(activeKyc.front_id_url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block border border-slate-900 rounded-xl overflow-hidden aspect-video bg-slate-950 hover:border-slate-750 transition-all relative group flex items-center justify-center"
                >
                  <img src={getFileUrl(activeKyc.front_id_url)} alt="Front ID" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; const f = e.target.parentNode.querySelector('.fallback-msg'); if (f) f.style.display = 'flex'; }} />
                  <div className="fallback-msg hidden absolute inset-0 flex-col items-center justify-center p-2 text-center text-[10px] text-slate-500">
                    <span>Failed to load image</span>
                    <span className="text-teal-450 mt-1 font-bold">Open Original</span>
                  </div>
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Open Original</span>
                  </div>
                </a>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">Back ID Document</span>
                <a 
                  href={getFileUrl(activeKyc.back_id_url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block border border-slate-900 rounded-xl overflow-hidden aspect-video bg-slate-950 hover:border-slate-750 transition-all relative group flex items-center justify-center"
                >
                  <img src={getFileUrl(activeKyc.back_id_url)} alt="Back ID" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; const f = e.target.parentNode.querySelector('.fallback-msg'); if (f) f.style.display = 'flex'; }} />
                  <div className="fallback-msg hidden absolute inset-0 flex-col items-center justify-center p-2 text-center text-[10px] text-slate-500">
                    <span>Failed to load image</span>
                    <span className="text-teal-450 mt-1 font-bold">Open Original</span>
                  </div>
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Open Original</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Remarks / Notes</label>
              <textarea
                rows={2}
                placeholder="Specify audit remarks, e.g. Valid Passport, ID expiration check passed"
                value={kycRemarks}
                onChange={(e) => setKycRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleKycDecision(true)}
                disabled={actionLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase active:scale-[0.98] cursor-pointer"
              >
                Approve KYC
              </button>
              <button
                onClick={() => handleKycDecision(false)}
                disabled={actionLoading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase active:scale-[0.98] cursor-pointer"
              >
                Reject KYC
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: Custody Broadcast Success Notification */}
      <Modal isOpen={custodySuccessOpen} onClose={() => { setCustodySuccessOpen(false); setCustodyTxDetails(null); }} title="Bitcoin Custody Broadcasted">
        {custodyTxDetails && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
              <Coins className="w-6 h-6 text-emerald-450 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-emerald-400 uppercase">Custody Release Successful</h5>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  The transaction was successfully broadcasted to the blockchain via our secure API.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Generated Transaction Hash</span>
              <div className="bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-xl font-mono text-xs text-teal-400 font-bold select-all break-all">
                {custodyTxDetails.tx_hash}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 text-center">
              <p className="text-[10px] text-slate-500 font-semibold">
                Network miner nodes are updating confirmation status in the background. Polling has been initialized.
              </p>
            </div>

            <button
              onClick={() => { setCustodySuccessOpen(false); setCustodyTxDetails(null); }}
              className="w-full py-2.5 bg-teal-650 hover:bg-teal-555 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              Close Ledger
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}
