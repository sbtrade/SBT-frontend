import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { ArrowUpRight, ArrowDownLeft, Send, Landmark, HelpCircle, RefreshCw, LandmarkIcon, AlertTriangle } from 'lucide-react';

export default function UserDashboard() {
  const [balanceData, setBalanceData] = useState({ balance: '0.00', total_credits: '0.00', total_debits: '0.00', kyc_status: 'NOT_SUBMITTED' });
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);

  // Forms state
  const [activeForm, setActiveForm] = useState('none'); // 'deposit', 'fund', 'transfer', 'withdraw', 'none'
  
  // Real Money Deposit State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositGateway, setDepositGateway] = useState('stripe');

  const [fundAmount, setFundAmount] = useState('');
  const [fundRemarks, setFundRemarks] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBtcAddress, setWithdrawBtcAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const balRes = await api.get('/wallet/balance');
      setBalanceData(balRes.data);

      const txRes = await api.get('/wallet/transactions');
      setTransactions(txRes.data.slice(0, 10));

      const reqRes = await api.get('/wallet/requests');
      setRequests(reqRes.data.slice(0, 10));
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDepositCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const res = await api.post('/wallet/deposit-checkout', {
        amount: depositAmount,
        currency: 'USD',
        gateway: depositGateway
      });

      // Redirect to the Checkout Simulator URL returned by API
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create checkout session.');
      setFormLoading(false);
    }
  };

  const handleFundRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);
    try {
      const res = await api.post('/wallet/fund-request', { amount: fundAmount, remarks: fundRemarks });
      setSuccess(res.data.message);
      setFundAmount('');
      setFundRemarks('');
      setActiveForm('none');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit fund request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTransferRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);
    try {
      const res = await api.post('/wallet/transfer-request', { receiver_user_id: transferUserId.trim(), amount: transferAmount });
      setSuccess(res.data.message);
      setTransferUserId('');
      setTransferAmount('');
      setActiveForm('none');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit transfer request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);
    try {
      const res = await api.post('/wallet/withdrawal-request', { amount: withdrawAmount, btc_address: withdrawBtcAddress.trim() });
      setSuccess(res.data.message);
      setWithdrawAmount('');
      setWithdrawBtcAddress('');
      setActiveForm('none');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit Bitcoin withdrawal request.');
    } finally {
      setFormLoading(false);
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(val || 0));
  };

  // Convert USD withdrawal amount to BTC live mock display
  const getBtcConverted = () => {
    const amount = parseFloat(withdrawAmount) || 0;
    return (amount / 65000.0).toFixed(8);
  };

  const kycApproved = balanceData.kyc_status === 'APPROVED';

  return (
    <div className="space-y-6">
      
      {/* Upper Status Notifications */}
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

      {/* KYC Restriction Guard Alert */}
      {!kycApproved && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-start gap-3 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold uppercase tracking-wider">KYC Compliance Lock</h4>
            <p className="text-slate-400 mt-1 leading-relaxed font-normal">
              You must upload government identification and receive KYC approval before you can deposit real money, request transfers, or withdraw Bitcoin. Go to **Complete KYC** in the sidebar.
            </p>
          </div>
        </div>
      )}

      {/* 1. Wallet overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block mb-2">Available Balance</span>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatMoney(balanceData.balance)}</h3>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">KYC State:</span>
            <StatusBadge status={balanceData.kyc_status} />
          </div>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Received (Credits)</span>
          <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">{formatMoney(balanceData.total_credits)}</h3>
        </div>

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Disbursed (Debits)</span>
          <h3 className="text-3xl font-extrabold text-rose-400 tracking-tight">{formatMoney(balanceData.total_debits)}</h3>
        </div>
      </div>

      {/* 2. Operations buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => { setActiveForm('deposit'); setError(''); setSuccess(''); }}
          disabled={!kycApproved}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            activeForm === 'deposit' ? 'bg-teal-600 border-teal-500 text-white shadow-lg' : 'bg-[#0a122c] border-slate-900 text-slate-350 hover:text-white'
          }`}
        >
          <LandmarkIcon className="w-4 h-4" />
          Deposit Funds
        </button>
        <button
          onClick={() => { setActiveForm('fund'); setError(''); setSuccess(''); }}
          disabled={!kycApproved}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            activeForm === 'fund' ? 'bg-teal-600 border-teal-500 text-white shadow-lg' : 'bg-[#0a122c] border-slate-900 text-slate-350 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Request Funds
        </button>
        <button
          onClick={() => { setActiveForm('transfer'); setError(''); setSuccess(''); }}
          disabled={!kycApproved}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            activeForm === 'transfer' ? 'bg-teal-600 border-teal-500 text-white shadow-lg' : 'bg-[#0a122c] border-slate-900 text-slate-350 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          Transfer Balance
        </button>
        <button
          onClick={() => { setActiveForm('withdraw'); setError(''); setSuccess(''); }}
          disabled={!kycApproved}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            activeForm === 'withdraw' ? 'bg-teal-600 border-teal-500 text-white shadow-lg' : 'bg-[#0a122c] border-slate-900 text-slate-350 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Bitcoin Withdrawal
        </button>
        
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-950/20 border border-slate-900 text-slate-500 hover:text-white transition-all cursor-pointer ml-auto"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Action Form Panel */}
      {activeForm !== 'none' && (
        <div className="bg-[#0c1938] border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden animate-in slide-in-from-top duration-200">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {activeForm === 'deposit' && 'Real-Money Deposit (Payment Gateway)'}
              {activeForm === 'fund' && 'Fund Credit Request'}
              {activeForm === 'transfer' && 'Wallet Balance Transfer'}
              {activeForm === 'withdraw' && 'Request Real Bitcoin Withdrawal'}
            </h4>
            <button onClick={() => setActiveForm('none')} className="text-xs text-slate-500 hover:text-slate-300 font-bold cursor-pointer">Close</button>
          </div>

          {/* DEPOSIT FORM */}
          {activeForm === 'deposit' && (
            <form onSubmit={handleDepositCheckout} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deposit Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway Provider</label>
                <select
                  value={depositGateway}
                  onChange={(e) => setDepositGateway(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-3.5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer"
                >
                  <option value="stripe">Stripe Checkout</option>
                  <option value="razorpay">Razorpay Checkout</option>
                  <option value="cashfree">Cashfree Gateway</option>
                  <option value="paypal">PayPal Merchant</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
              >
                {formLoading ? 'Creating Session...' : 'Proceed to Checkout'}
              </button>
            </form>
          )}

          {/* FUND FORM */}
          {activeForm === 'fund' && (
            <form onSubmit={handleFundRequest} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks / Purpose</label>
                <input
                  type="text"
                  placeholder="Reason for requesting fund credit"
                  value={fundRemarks}
                  onChange={(e) => setFundRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
              >
                {formLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}

          {/* TRANSFER FORM */}
          {activeForm === 'transfer' && (
            <form onSubmit={handleTransferRequest} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient User ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. USR1002"
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfer Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
              >
                {formLoading ? 'Submitting...' : 'Submit Transfer'}
              </button>
            </form>
          )}

          {/* BITCOIN WITHDRAWAL FORM */}
          {activeForm === 'withdraw' && (
            <form onSubmit={handleWithdrawalRequest} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bitcoin Destination Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bc1xxxxxxxxxxxxxxxxxxxx"
                  value={withdrawBtcAddress}
                  onChange={(e) => setWithdrawBtcAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Withdraw Amount (USD)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono pr-28"
                  />
                  <div className="absolute right-3.5 top-2 text-[11px] font-mono text-slate-500 font-bold bg-slate-900 border border-slate-850 rounded px-2.5 py-0.5">
                    ≈ {getBtcConverted()} BTC
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-semibold mt-1 block">
                  * Calculated at mock conversion rate of $65,000.00 per Bitcoin.
                </span>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
              >
                {formLoading ? 'Broadcasting...' : 'Broadcast BTC Withdrawal'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 4. Display History logs in tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions */}
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Recent Transactions</h4>
              <span className="text-[9px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-xl uppercase tracking-wider">Audited Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">Tx ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-350 font-semibold">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">No transactions registered.</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3 px-2 font-mono text-slate-400 flex items-center gap-1.5">
                          {tx.id}
                          {tx.aml_flagged && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-455 text-[8px] font-black uppercase tracking-wider border border-rose-500/20 animate-pulse">AML</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="py-3 font-bold text-[9px] uppercase tracking-wider text-slate-300">
                          {tx.type}
                          {tx.payment_id && <span className="text-[8px] font-mono text-slate-500 block lowercase">{tx.payment_id}</span>}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-200">{formatMoney(tx.amount)}</td>
                        <td className="py-3 text-right px-2">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Requests Queue Log */}
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Requests Log</h4>
              <span className="text-[9px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-xl uppercase tracking-wider">Approval States</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-slate-350 font-semibold">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">No request records.</td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.req_type + req.id} className="hover:bg-slate-950/10 transition-colors">
                        <td className="py-3 px-2 font-bold text-[9px] uppercase tracking-wider text-slate-300">{req.req_type}</td>
                        <td className="py-3 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-slate-400 truncate max-w-[150px]">
                          {req.req_type === 'TRANSFER' && `To ${req.receiver_user_id}`}
                          {req.req_type === 'WITHDRAWAL' && (
                            <div>
                              <span className="block truncate font-mono text-[9px]" title={req.btc_address}>BTC Address: {req.btc_address}</span>
                              {req.confirmations > 0 && (
                                <span className="text-[8px] font-bold text-teal-400 uppercase tracking-wide">
                                  {req.confirmations}/6 Confirmations
                                </span>
                              )}
                            </div>
                          )}
                          {req.req_type === 'FUND' && (req.remarks || 'Wallet Credit')}
                          {req.req_type === 'KYC' && 'Doc Upload'}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-200">
                          {req.amount ? (
                            <div>
                              <span>{formatMoney(req.amount)}</span>
                              {req.btc_amount && <span className="block text-[9px] text-slate-500 font-mono">({parseFloat(req.btc_amount).toFixed(6)} BTC)</span>}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-3 text-right px-2">
                          <StatusBadge status={req.status} />
                        </td>
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
