import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import StatusBadge from '../../components/StatusBadge';
import { User, Mail, Phone, Building2, Briefcase, Calendar, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function EmployeeProfile() {
  const { user, refreshMe } = useAuth();

  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      setSubmitting(false);
      return;
    }

    try {
      const payload = { phone };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await authService.updateProfile(payload);
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshMe();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          My Workplace Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your official EHBVS Solutions employment details and update personal contact or security settings.
        </p>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', text: '' })} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Corporate Record (Read-Only) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-4 h-4 text-blue-600" />
          Official Employment Credentials (Admin Verified)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Employee ID</span>
            <p className="font-mono font-bold text-slate-900 mt-1 text-sm">{user?.employeeId}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Corporate Email</span>
            <p className="font-semibold text-slate-900 mt-1">{user?.email}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Role</span>
            <div className="mt-1">
              <StatusBadge status={user?.role} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
            <p className="font-semibold text-slate-900 mt-1">{user?.department}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Designation</span>
            <p className="font-semibold text-slate-900 mt-1">{user?.designation}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Joining Date</span>
            <p className="font-mono font-semibold text-slate-900 mt-1">
              {new Date(user?.joiningDate || user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Details Form */}
      <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
          Update Contact & Security Credentials
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Contact Phone Number
          </label>
          <div className="relative max-w-sm">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 00000"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-800">
            Change Password (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password</label>
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {submitting ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
