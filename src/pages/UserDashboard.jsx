import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { ArrowUpRight, ArrowDownLeft, Send, Landmark, HelpCircle, RefreshCw, LandmarkIcon, AlertTriangle, Copy, Check, Camera, Scan, User, Upload } from 'lucide-react';

export default function UserDashboard() {
  const [balanceData, setBalanceData] = useState({ balance: '0.00', total_credits: '0.00', total_debits: '0.00', kyc_status: 'NOT_SUBMITTED', wallet_address: null });
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);

  // Forms state
  const [activeForm, setActiveForm] = useState('none'); // 'deposit', 'fund', 'transfer', 'withdraw', 'none'
  const [transferWalletAddress, setTransferWalletAddress] = useState('');
  const [verifiedReceiver, setVerifiedReceiver] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [simulateScanOpen, setSimulateScanOpen] = useState(false);
  const [activeAddresses, setActiveAddresses] = useState([]);
  const [copied, setCopied] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // QR Scanning Refs and State
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const [scanMethod, setScanMethod] = useState('camera'); // 'camera', 'upload', 'simulate'
  const [cameraError, setCameraError] = useState('');
  const [scanStream, setScanStream] = useState(null);
  
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

  const handleVerifyReceiver = async (addressToVerify) => {
    const addr = (addressToVerify || transferWalletAddress).trim();
    if (!addr) return;
    setIsVerifying(true);
    setVerificationError('');
    setVerifiedReceiver(null);
    try {
      const res = await api.post('/wallet/verify-receiver', { wallet_address: addr });
      setVerifiedReceiver(res.data.receiver);
    } catch (err) {
      setVerificationError(err.response?.data?.error || 'Failed to verify wallet address.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTransferRequest = async (e) => {
    if (e) e.preventDefault();
    if (!verifiedReceiver) {
      setError('Please verify the recipient wallet address first.');
      return;
    }
    
    setError('');
    setSuccess('');
    setFormLoading(true);
    try {
      const res = await api.post('/wallet/transfer-request', { 
        receiver_wallet_address: verifiedReceiver.wallet_address, 
        amount: transferAmount 
      });
      setSuccess(res.data.message);
      setTransferWalletAddress('');
      setTransferAmount('');
      setVerifiedReceiver(null);
      setActiveForm('none');
      setConfirmSendOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit transfer request.');
    } finally {
      setFormLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setScanStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(e => console.warn('Video play interrupted:', e));
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions or try uploading a QR image file.');
    }
  };

  const stopCamera = () => {
    if (scanStream) {
      scanStream.getTracks().forEach(track => track.stop());
      setScanStream(null);
    }
  };

  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (simulateScanOpen && scanMethod === 'camera') {
        requestAnimationFrame(tick);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code) {
        handleScanSuccess(code.data);
        return;
      }
    }
    if (simulateScanOpen && scanMethod === 'camera') {
      requestAnimationFrame(tick);
    }
  };

  const handleScanSuccess = (address) => {
    stopCamera();
    setTransferWalletAddress(address);
    setSimulateScanOpen(false);
    handleVerifyReceiver(address);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScanSuccess(code.data);
          } else {
            alert('No QR Code found in this image. Please upload a clear image of a wallet QR code.');
          }
        } else {
          alert('QR scanner library not loaded yet. Please try again in a moment.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (simulateScanOpen && scanMethod === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [simulateScanOpen, scanMethod]);

  const openSimulateScan = async () => {
    setSimulateScanOpen(true);
    setScanMethod('camera');
    try {
      const res = await api.get('/wallet/active-addresses');
      setActiveAddresses(res.data);
    } catch (err) {
      console.error('Failed to load active addresses:', err);
    }
  };

  const handleSimulateScanSelect = (address) => {
    handleScanSuccess(address);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
          <span className="text-[10px] font-bold text-teal-450 uppercase tracking-widest block mb-2 w-full text-left">My Wallet Address</span>
          {balanceData.wallet_address ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="p-1.5 bg-white rounded-2xl flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${balanceData.wallet_address}&color=0a122c`} 
                  alt="Wallet QR Code" 
                  className="w-20 h-20" 
                />
              </div>
              <div className="w-full">
                <span className="block font-mono text-[9px] bg-slate-950 px-2 py-1.5 rounded-xl text-slate-350 border border-slate-900 select-all break-all cursor-pointer hover:border-slate-800 hover:text-white flex items-center justify-center gap-1" title="Click to copy wallet address" onClick={() => {
                  navigator.clipboard.writeText(balanceData.wallet_address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {balanceData.wallet_address}
                </span>
                <span className="text-[8px] text-slate-500 font-semibold block mt-1">Click address to copy</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-555 py-8">Generating address...</span>
          )}
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
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. sbt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={transferWalletAddress}
                    onChange={(e) => {
                      setTransferWalletAddress(e.target.value);
                      if (verifiedReceiver) setVerifiedReceiver(null);
                      if (verificationError) setVerificationError('');
                    }}
                    className="flex-1 bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={openSimulateScan}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Simulate scanning a wallet QR Code"
                  >
                    <Scan className="w-4 h-4 text-teal-400" />
                    Scan QR
                  </button>
                </div>
              </div>

              {verificationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-[11px] font-semibold animate-shake">
                  {verificationError}
                </div>
              )}

              {verifiedReceiver && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
                  verifiedReceiver.is_external 
                    ? 'bg-amber-950/20 border border-amber-500/20 text-amber-400' 
                    : 'bg-teal-950/20 border border-teal-500/20 text-teal-400'
                }`}>
                  {verifiedReceiver.is_external ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" /> : <User className="w-5 h-5 text-teal-400 shrink-0" />}
                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {verifiedReceiver.is_external ? 'External Recipient (Manual Queue)' : 'Verified Recipient'}
                    </span>
                    <span className="block text-slate-200 font-extrabold text-sm">{verifiedReceiver.fullname}</span>
                    <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                      {verifiedReceiver.is_external ? 'Target Address: ' + verifiedReceiver.wallet_address : 'ID: ' + verifiedReceiver.user_id}
                    </span>
                  </div>
                </div>
              )}

              {!verifiedReceiver && (
                <button
                  type="button"
                  onClick={() => handleVerifyReceiver()}
                  disabled={isVerifying || !transferWalletAddress.trim()}
                  className="w-full py-2.5 bg-teal-700/60 hover:bg-teal-650 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isVerifying ? 'Verifying Address...' : 'Verify Address'}
                </button>
              )}

              {verifiedReceiver && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfer Amount (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-sm font-mono text-slate-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmSendOpen(true)}
                    disabled={formLoading || !transferAmount || parseFloat(transferAmount) <= 0}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Send Transfer
                  </button>
                </div>
              )}
            </div>
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
                      <tr 
                        key={tx.id} 
                        className="hover:bg-slate-950/20 transition-colors cursor-pointer active:scale-[0.99]"
                        onClick={() => setSelectedTx(tx)}
                        title="Click to view transaction receipt"
                      >
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

      </div>      {/* Confirmation Modal */}
      <Modal isOpen={confirmSendOpen} onClose={() => setConfirmSendOpen(false)} title="Confirm Fund Transfer">
        {verifiedReceiver && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              verifiedReceiver.is_external ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-500/5 border border-amber-500/10'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${verifiedReceiver.is_external ? 'text-amber-500' : 'text-amber-400'}`} />
              <div className="text-xs text-slate-350">
                <p className={`font-bold uppercase tracking-wide ${verifiedReceiver.is_external ? 'text-amber-500' : 'text-amber-400'}`}>
                  {verifiedReceiver.is_external ? 'External Fulfiller Alert' : 'Verification Shield Active'}
                </p>
                <p className="mt-1">
                  {verifiedReceiver.is_external 
                    ? 'This address is external to our system. The transfer will be placed in the PENDING queue. The admin will verify the address, execute the send externally, and approve this request. Your balance will be deducted only upon approval.'
                    : 'Please verify the recipient details below. Once confirmed, this transaction will be submitted to the ledger for administrative approval.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Recipient Name</span>
                  <span className="block font-bold text-slate-200 mt-0.5">{verifiedReceiver.fullname}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Recipient User ID</span>
                  <span className="block font-mono font-bold text-slate-200 mt-0.5">{verifiedReceiver.user_id}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Recipient Wallet Address</span>
                <span className="block font-mono text-[9px] text-teal-400 mt-0.5 break-all">{verifiedReceiver.wallet_address}</span>
              </div>
              <div className="pt-2 border-t border-slate-900 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Transfer Amount</span>
                <span className="text-2xl font-black text-white">{formatMoney(transferAmount)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSendOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferRequest}
                disabled={formLoading}
                className="flex-1 py-2.5 bg-teal-650 hover:bg-teal-600 text-white rounded-xl text-xs font-bold uppercase active:scale-[0.98] cursor-pointer border border-teal-500/20"
              >
                {formLoading ? 'Submitting...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* QR Scanner Modal (Camera, Image Upload, Simulation) */}
      <Modal isOpen={simulateScanOpen} onClose={() => setSimulateScanOpen(false)} title="Scan Wallet QR Code">
        <div className="space-y-4">
          {/* Scan Tabs */}
          <div className="grid grid-cols-3 gap-2 border-b border-slate-900 pb-3">
            <button
              type="button"
              onClick={() => setScanMethod('camera')}
              className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                scanMethod === 'camera' 
                  ? 'bg-teal-950/20 text-teal-400 font-bold border border-teal-500/20' 
                  : 'bg-slate-950/45 text-slate-500 hover:text-slate-350'
              }`}
            >
              Camera
            </button>
            <button
              type="button"
              onClick={() => setScanMethod('upload')}
              className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                scanMethod === 'upload' 
                  ? 'bg-teal-950/20 text-teal-400 font-bold border border-teal-500/20' 
                  : 'bg-slate-950/45 text-slate-500 hover:text-slate-350'
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setScanMethod('simulate')}
              className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                scanMethod === 'simulate' 
                  ? 'bg-teal-950/20 text-teal-400 font-bold border border-teal-500/20' 
                  : 'bg-slate-950/45 text-slate-500 hover:text-slate-350'
              }`}
            >
              Simulate Scan
            </button>
          </div>

          {/* Tab 1: Camera Scanning */}
          {scanMethod === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-350 text-xs text-center font-semibold">
                  {cameraError}
                </div>
              ) : (
                <div className="relative border border-slate-850 rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-teal-500/30 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-teal-450 border-dashed rounded-2xl animate-pulse flex items-center justify-center">
                      <span className="text-[10px] text-teal-300 font-bold bg-slate-950/80 px-2 py-1 rounded-lg">Align QR Code here</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Upload QR Image */}
          {scanMethod === 'upload' && (
            <div className="p-6 border border-dashed border-slate-800 rounded-2xl bg-[#030712] flex flex-col items-center justify-center text-center space-y-4">
              <Upload className="w-8 h-8 text-teal-450" />
              <div>
                <h5 className="text-xs font-bold text-slate-350">Select QR Code Image File</h5>
                <p className="text-[9px] text-slate-500 font-semibold mt-1">Upload a screenshot or photo containing a wallet address QR code.</p>
              </div>
              <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all inline-block">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Tab 3: Simulate Scanning */}
          {scanMethod === 'simulate' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">Select a mock wallet address below to simulate scanning it.</p>
              </div>
              
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-900/60 border border-slate-900 rounded-xl bg-slate-950">
                {activeAddresses.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No other active users found to simulate scan.</div>
                ) : (
                  activeAddresses.map(addr => (
                    <div key={addr.wallet_address} className="p-3 hover:bg-slate-900/40 transition-colors flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-200">{addr.fullname}</span>
                        <span className="block font-mono text-[9px] text-slate-500 truncate max-w-[200px] mt-0.5">{addr.wallet_address}</span>
                      </div>
                      <button
                        onClick={() => handleSimulateScanSelect(addr.wallet_address)}
                        className="px-2.5 py-1 bg-teal-650/80 hover:bg-teal-600 text-white rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setSimulateScanOpen(false)}
            className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
          >
            Cancel
          </button>
        </div>
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
                        <span className="block font-mono text-[9px] text-teal-400 select-all break-all mt-0.5" title="Copy recipient wallet address">
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
    <span className="text-[9px] font-bold tracking-[0.25em] text-slate-400 uppercase font-sans -mt-0.5">WALLET APP</span>
  </div>
);
