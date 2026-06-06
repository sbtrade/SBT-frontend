import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, KeyRound, Terminal } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Force password change state
  const [forceChangeMode, setForceChangeMode] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state for administrative logins
  const [requires2FA, setRequires2FA] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [debug2FA, setDebug2FA] = useState(null);

  const navigate = useNavigate();

  // Poll debug 2FA codes for easy testing
  useEffect(() => {
    let interval;
    if (requires2FA && userId) {
      const fetchDebug2FA = async () => {
        try {
          const res = await api.get(`/auth/debug/otps/${userId}`);
          setDebug2FA(res.data);
        } catch (err) {
          // Silent catch
        }
      };
      fetchDebug2FA();
      interval = setInterval(fetchDebug2FA, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requires2FA, userId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) return;

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { user_id: userId.trim(), password });
      
      // Handle 2FA gate
      if (res.data.requires_2fa) {
        setRequires2FA(true);
        setTemp2FAToken(res.data.temp_token);
        setLoading(false);
        return;
      }

      const { accessToken, refreshToken, user } = res.data;

      // Handle force password change redirect
      if (user.must_change_password) {
        setForceChangeMode(true);
        setTempToken(accessToken);
        setOldPassword(password);
        localStorage.setItem('sbt_access_token', accessToken); 
        setLoading(false);
        return;
      }

      // Standard customer success login
      localStorage.setItem('sbt_access_token', accessToken);
      localStorage.setItem('sbt_refresh_token', refreshToken);
      localStorage.setItem('sbt_user', JSON.stringify(user));

      onLoginSuccess(user);
      navigate('/user');

    } catch (err) {
      console.error('Login submit error:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    if (!twoFactorCode) return;

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/2fa/verify', {
        temp_token: temp2FAToken,
        code: twoFactorCode.trim()
      });

      const { accessToken, refreshToken, user } = res.data;

      // Check if administrative user requires password change (seeded credentials)
      if (user.must_change_password) {
        setForceChangeMode(true);
        setTempToken(accessToken);
        setOldPassword(password);
        localStorage.setItem('sbt_access_token', accessToken);
        setRequires2FA(false);
        setLoading(false);
        return;
      }

      // Full access granted
      localStorage.setItem('sbt_access_token', accessToken);
      localStorage.setItem('sbt_refresh_token', refreshToken);
      localStorage.setItem('sbt_user', JSON.stringify(user));

      onLoginSuccess(user);

      if (user.role === 'SUPER_ADMIN') navigate('/superadmin');
      else if (user.role === 'ADMIN') navigate('/admin');

    } catch (err) {
      setError(err.response?.data?.error || 'Invalid 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. SBTWallet@2026).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      localStorage.removeItem('sbt_access_token');
      setForceChangeMode(false);
      setUserId('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      alert('Password updated successfully. Please log in with your new password.');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c1224] border border-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Elements */}
        <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Brand Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">
            {requires2FA ? '2FA Code Verification' : forceChangeMode ? 'Setup New Password' : 'SBT'}
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {requires2FA 
              ? 'An administrative 2FA verification code has been generated.' 
              : forceChangeMode 
                ? 'First login requires setting up a secure personal password.' 
                : 'Smart Banking Treasury'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-455 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-350 leading-relaxed">{error}</p>
          </div>
        )}

        {/* 2FA VERIFICATION GATED VIEW */}
        {requires2FA ? (
          <form onSubmit={handle2FAVerify} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 text-center text-[11px] text-slate-450 font-semibold">
              Enter the 6-digit administrative 2-Factor Authentication code below to unlock dashboard session.
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">2FA Verification Code</label>
              <div className="relative max-w-[200px] mx-auto">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-3 rounded-xl text-center font-bold font-mono tracking-widest text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-950/20 cursor-pointer transition-all mt-2"
            >
              {loading ? 'Verifying...' : 'Verify & Unlock'}
            </button>

            {/* MOCK 2FA DEBUG HELPER FOR TESTING */}
            {debug2FA && (
              <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-900 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-teal-400 font-bold mb-1 uppercase tracking-wide">
                  <Terminal className="w-3.5 h-3.5" />
                  Local 2FA Code
                </div>
                <p className="text-[9px] text-slate-500 font-semibold mb-2">(Fetched for developer testing convenience)</p>
                <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg inline-block font-mono font-bold text-teal-400 text-sm tracking-widest px-6">
                  {debug2FA.email_otp}
                </div>
              </div>
            )}
          </form>
        ) : forceChangeMode ? (
          /* FORCED PASSWORD CHANGE SCREEN */
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-3 rounded-xl text-sm transition-all pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Confirm secure password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-3 rounded-xl text-sm transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-950/20 cursor-pointer transition-all mt-2"
            >
              {loading ? 'Updating...' : 'Update & Log In'}
            </button>
          </form>
        ) : (
          /* REGULAR LOGIN SCREEN */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User ID / Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. USR1001, SUPERADMIN001"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white pl-11 pr-4 py-3 rounded-xl text-sm transition-all font-mono"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password" className="text-[10px] text-teal-400 hover:underline font-bold">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white pl-11 pr-12 py-3 rounded-xl text-sm transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-950/20 cursor-pointer transition-all mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="text-center pt-4 border-t border-slate-900 mt-5">
              <span className="text-xs text-slate-500 font-semibold">Need an account? </span>
              <Link to="/register" className="text-xs text-teal-400 hover:underline font-bold">Submit Registration</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
