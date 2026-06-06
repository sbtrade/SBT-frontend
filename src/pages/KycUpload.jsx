import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function KycUpload() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');
  const [kycRemarks, setKycRemarks] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchKycStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/balance');
      setKycStatus(res.data.kyc_status);
      
      // If pending or approved, we can fetch all requests to get details
      const reqsRes = await api.get('/wallet/requests');
      const kycDetail = reqsRes.data.find(r => r.req_type === 'KYC');
      if (kycDetail) {
        setKycRemarks(kycDetail.remarks || '');
      }
    } catch (err) {
      console.error('Fetch KYC status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!frontFile || !backFile) {
      setError('Please select both Front ID and Back ID files.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('front', frontFile);
    formData.append('back', backFile);

    try {
      const res = await api.post('/wallet/kyc-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(res.data.message);
      setFrontFile(null);
      setBackFile(null);
      fetchKycStatus();
    } catch (err) {
      console.error('KYC Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload documents.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">KYC Identity Verification Status</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-2xl gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Verification State</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={kycStatus} />
              {kycStatus === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
          </div>

          {kycRemarks && (
            <div className="sm:text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Admin Remarks</span>
              <p className="text-xs font-semibold text-slate-350">{kycRemarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Form (only show if not submitted or if rejected) */}
      {(kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED') && (
        <div className="bg-[#0a122c] border border-slate-900/60 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2">Upload ID Documents</h3>
          <p className="text-[11px] text-slate-500 font-semibold mb-6">
            Please upload clear, legible copies of your ID (Drivers License, Passport, or National Identity Card). JPG, PNG, and PDF formats accepted. Max file size: 5MB.
          </p>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-455 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-350">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-455 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-emerald-350">{success}</p>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Front File Picker */}
              <div className="border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-700 hover:bg-slate-950/20 transition-all relative">
                <input
                  type="file"
                  id="front-id-file"
                  required
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => setFrontFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  {frontFile ? <FileText className="w-5 h-5 text-teal-400" /> : <Upload className="w-5 h-5" />}
                </div>
                <h4 className="text-xs font-bold text-slate-200">FRONT OF ID</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-1 truncate max-w-full px-2">
                  {frontFile ? frontFile.name : 'Click to select front file'}
                </p>
              </div>

              {/* Back File Picker */}
              <div className="border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-700 hover:bg-slate-950/20 transition-all relative">
                <input
                  type="file"
                  id="back-id-file"
                  required
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => setBackFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  {backFile ? <FileText className="w-5 h-5 text-teal-400" /> : <Upload className="w-5 h-5" />}
                </div>
                <h4 className="text-xs font-bold text-slate-200">BACK OF ID</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-1 truncate max-w-full px-2">
                  {backFile ? backFile.name : 'Click to select back file'}
                </p>
              </div>

            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
              >
                {submitting ? 'Uploading...' : 'Submit Documents'}
              </button>
            </div>
          </form>
        </div>
      )}

      {kycStatus === 'PENDING' && (
        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center gap-3">
          <FileText className="w-5 h-5 text-amber-400" />
          <p className="text-xs font-semibold text-slate-450">
            Your identity files are currently in the queue. The Admin will review them shortly.
          </p>
        </div>
      )}
    </div>
  );
}
