import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { KeyRound, ShieldAlert, ArrowLeft, Terminal, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify OTP, 3 = Show Temp Password
  
  // Verification states
  const [emailOtp, setEmailOtp] = useState('');
  const [smsOtp, setSmsOtp] = useState('');
  
  // Success state
  const [tempPassword, setTempPassword] = useState('');
  
  // Lock / Admin approval flag
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  
  // Debug OTPs state for easy testing
  const [debugOtps, setDebugOtps] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Poll debug OTPs if in verification step
  useEffect(() => {
    let interval;
    if (step === 2 && userId) {
      const fetchDebugOtps = async () => {
        try {
          const res = await api.get(`/auth/debug/otps/${userId}`);
          setDebugOtps(res.data);
        } catch (err) {
          // Silent failure on debug retrieval
        }
      };

      fetchDebugOtps();
      interval = setInterval(fetchDebugOtps, 2000); // Poll every 2 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, userId]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password/request', {
        user_id: userId.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim()
      });

      // Handle Admin Approval lockout rule (Reset count >= 2)
      if (res.data.requires_admin_approval) {
        setRequiresAdminApproval(true);
        setLockMessage(res.data.message);
        setStep(1);
      } else {
        // First reset, OTPs sent
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed. Verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password/verify', {
        user_id: userId.trim(),
        email_otp: emailOtp.trim(),
        sms_otp: smsOtp.trim()
      });

      setTempPassword(res.data.temporary_password);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c1224] border border-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white font-bold transition-all mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">Forgot Password</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Retrieve access to your wallet portal.</p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-455 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-350">{error}</p>
          </div>
        )}

        {/* ACCOUNT RESET BLOCKED BY ADMIN APPROVAL (Second forgot rule) */}
        {requiresAdminApproval && (
          <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-450 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Manual Reset Required</h4>
              <p className="text-xs font-semibold text-slate-350 leading-relaxed mt-1">{lockMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Details Submission */}
        {step === 1 && !requiresAdminApproval && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User ID</label>
              <input
                type="text"
                required
                placeholder="e.g. USR1001"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Email</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Phone</label>
              <input
                type="text"
                required
                placeholder="10 digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-950/20 cursor-pointer transition-all mt-2"
            >
              {loading ? 'Validating...' : 'Request Verification OTPs'}
            </button>
          </form>
        )}

        {/* STEP 2: Verify Dual OTPs */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-850 text-center">
              <p className="text-[11px] text-slate-450 font-semibold">
                Verification codes are generated. Enter both code blocks below.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Email OTP (6 digits)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-3 rounded-xl text-sm text-center font-bold font-mono tracking-widest"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">SMS OTP (6 digits)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={smsOtp}
                  onChange={(e) => setSmsOtp(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-3 rounded-xl text-sm text-center font-bold font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-950/20 cursor-pointer transition-all mt-2"
            >
              {loading ? 'Verifying...' : 'Verify OTPs'}
            </button>

            {/* MOCK TESTING HELPER BADGE PANEL */}
            {debugOtps && (
              <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-900 relative">
                <div className="flex items-center gap-1.5 text-xs text-teal-400 font-bold mb-2 uppercase tracking-wide">
                  <Terminal className="w-3.5 h-3.5" />
                  Local Debug OTP Codes
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mb-3">
                  (Simulated SMS/Email delivery codes fetched from backend session)
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold text-center">
                  <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold mb-1">Email OTP</span>
                    <span className="text-teal-400 text-sm tracking-widest">{debugOtps.email_otp}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold mb-1">SMS OTP</span>
                    <span className="text-teal-400 text-sm tracking-widest">{debugOtps.sms_otp}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* STEP 3: Show Generated Temp Password */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col items-center text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Reset Successful</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Your temporary password has been successfully generated.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Temporary Password</label>
              <div className="bg-[#020617] border border-slate-850 rounded-xl p-4 text-center font-bold font-mono text-teal-400 tracking-wider select-all cursor-pointer text-lg" title="Click to select all">
                {tempPassword}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-850">
              <p className="text-[11px] text-slate-450 leading-relaxed text-center font-semibold">
                <strong>Attention:</strong> Log in with this credentials string. You will be forced to configure a new personal password on login.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full block text-center py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
