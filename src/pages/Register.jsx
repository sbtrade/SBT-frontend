import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ClipboardList, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend Validations
    if (fullname.trim().length < 3 || fullname.length > 100) {
      setError('Full Name must be between 3 and 100 characters.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Phone Number must be exactly 10 digits.');
      return;
    }
    if (address.trim().length < 10) {
      setError('Address must be at least 10 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        fullname: fullname.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        password
      });

      setSuccess(res.data.message);
      // Clean form fields
      setFullname('');
      setPhone('');
      setEmail('');
      setAddress('');
      setPassword('');
    } catch (err) {
      console.error('Registration submit error:', err);
      setError(err.response?.data?.error || 'Registration failed. Email or phone number might already exist.');
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
            <ClipboardList className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">Register Account</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Submit your details to the queue for approval.</p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-455 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-350">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-455 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-emerald-350">{success}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
              <input
                type="text"
                required
                placeholder="10 digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</label>
            <textarea
              required
              placeholder="Enter full physical address (min 10 chars)"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
            <input
              type="password"
              required
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-950/20 cursor-pointer transition-all mt-2"
          >
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
