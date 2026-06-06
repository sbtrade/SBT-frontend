import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CheckoutSimulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentId = searchParams.get('pay_id') || '';
  const userId = searchParams.get('user_id') || '';
  const amount = searchParams.get('amount') || '0.00';
  const gateway = searchParams.get('gateway') || 'stripe';

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      // Simulate Stripe/Razorpay Webhook trigger call
      const res = await axios.post(`${API_BASE_URL}/wallet/webhook`, {
        event: 'checkout.session.completed',
        data: {
          payment_id: paymentId,
          user_id: parseInt(userId),
          amount: parseFloat(amount),
          currency: 'USD',
          gateway: gateway
        }
      });

      if (res.data.status === 'SUCCESS') {
        setSuccess(true);
        setTimeout(() => {
          // Redirect back to user dashboard
          navigate('/user');
        }, 3000);
      }
    } catch (err) {
      console.error('Simulated webhook failed:', err);
      setError(err.response?.data?.error || 'Simulated payment processing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c1224] border border-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">SBT Checkout Gateway</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Simulated checkout wrapper for {gateway === 'stripe' ? 'Stripe' : 'Razorpay'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Payment Succeeded!</h3>
            <p className="text-xs text-slate-400 font-semibold">
              Firing payment confirmation webhook to SBT server... Redirecting you back to your wallet.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-5">
            <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Total Charge</span>
                <span className="text-white font-mono font-bold text-sm">${parseFloat(amount).toFixed(2)} USD</span>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-1 bg-slate-900 border border-slate-850 rounded text-slate-400">
                REF: {paymentId}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Card Number</label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiration Date</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-mono text-center"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Card CVV</label>
                <input
                  type="password"
                  required
                  maxLength={3}
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 focus:border-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-mono text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-650 hover:bg-teal-555 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authorizing...
                </>
              ) : (
                `Pay $${parseFloat(amount).toFixed(2)} USD`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
