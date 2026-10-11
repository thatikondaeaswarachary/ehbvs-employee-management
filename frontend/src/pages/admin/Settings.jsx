import React, { useState, useEffect } from 'react';
import settingsService from '../../services/settingsService';
import authService from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import {
  Settings,
  Building,
  Clock,
  Shield,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchSettingsAndAudit = async () => {
    try {
      setLoading(true);
      setError('');
      const [setRes, logRes] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getAuditLogs({ limit: 50 })
      ]);
      if (setRes.success) setSettings(setRes.settings || {});
      if (logRes.success) setAuditLogs(logRes.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
  }, []);

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingsService.updateSettings(settings);
      setFeedback({ type: 'success', text: 'System configuration saved successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update settings.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await authService.updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setFeedback({ type: 'success', text: 'Administrator password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Password update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: r => <span className="font-mono text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</span>
    },
    {
      header: 'Actor',
      accessor: 'actorName',
      render: r => <span className="font-semibold text-slate-800">{r.actorName}</span>
    },
    {
      header: 'Action Taken',
      accessor: 'action',
      render: r => <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">{r.action}</span>
    },
    {
      header: 'Entity',
      accessor: 'entity',
      render: r => <span className="text-xs text-slate-600">{r.entity} #{r.entityId}</span>
    }
  ];

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading administrative settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System & Enterprise Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure working hours, corporate parameters, security credentials, and view immutable audit trails.
          </p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', text: '' })} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'general', label: 'Company & Working Hours', icon: Building },
          { id: 'security', label: 'Security & Password', icon: Shield },
          { id: 'audit', label: 'Audit Trail Logs', icon: FileSpreadsheet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'general' && settings && (
        <form onSubmit={handleSettingsSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Corporate Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={settings.companyAddress || ''}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Working Hours & Policy Parameters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Shift Start</label>
                <input
                  type="time"
                  value={settings.workStartTime || '09:00'}
                  onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Shift End</label>
                <input
                  type="time"
                  value={settings.workEndTime || '18:00'}
                  onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hours per Day</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.dailyWorkHoursTarget || 8}
                  onChange={(e) => setSettings({ ...settings, dailyWorkHoursTarget: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? 'Saving Settings...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
            Administrator Password
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
          >
            {submitting ? 'Updating Password...' : 'Update Admin Password'}
          </button>
        </form>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <DataTable
            columns={auditColumns}
            data={auditLogs}
            searchPlaceholder="Search audit trails..."
          />
        </div>
      )}
    </div>
  );
}
