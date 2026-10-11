import React, { useState, useEffect } from 'react';
import leaveService from '../../services/leaveService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import MetricCard from '../../components/MetricCard';
import Modal from '../../components/Modal';
import {
  CalendarDays,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  HeartPulse,
  User
} from 'lucide-react';

export default function EmployeeLeave() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getMyLeaves();
      if (res.success) {
        setLeaves(res.leaves || []);
        setBalances(res.balances);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    if (formData.toDate < formData.fromDate) {
      setFeedback({ type: 'error', text: 'To Date cannot be earlier than From Date.' });
      setSubmitting(false);
      return;
    }

    try {
      await leaveService.applyLeave(formData);
      setFeedback({ type: 'success', text: 'Leave application submitted for administrative review.' });
      setModalOpen(false);
      setFormData({
        leaveType: 'Casual Leave',
        fromDate: '',
        toDate: '',
        reason: ''
      });
      fetchLeaveData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Application failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Leave Type',
      accessor: 'leaveType',
      render: r => <span className="font-semibold text-slate-800">{r.leaveType}</span>
    },
    {
      header: 'From Date',
      accessor: 'fromDate',
      render: r => <span className="font-mono text-xs text-slate-700">{r.fromDate}</span>
    },
    {
      header: 'To Date',
      accessor: 'toDate',
      render: r => <span className="font-mono text-xs text-slate-700">{r.toDate}</span>
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: r => <p className="text-xs text-slate-600 line-clamp-1 max-w-sm">{r.reason}</p>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: r => <StatusBadge status={r.status} />
    },
    {
      header: 'Reviewer Remarks',
      accessor: 'adminRemarks',
      render: r => <span className="text-xs text-slate-500 italic">{r.adminRemarks || '—'}</span>
    },
    {
      header: 'Applied Date',
      accessor: 'createdAt',
      render: r => <span className="font-mono text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apply for planned leaves, view your annual PTO balances, and monitor approval status.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Apply For Leave
        </button>
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

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Casual Leave"
          value={`${balances?.casual?.remaining ?? 12} Left`}
          subtitle={`Used ${balances?.casual?.used ?? 0} of 12 days`}
          icon={CalendarDays}
          color="blue"
        />
        <MetricCard
          title="Sick Leave"
          value={`${balances?.sick?.remaining ?? 10} Left`}
          subtitle={`Used ${balances?.sick?.used ?? 0} of 10 days`}
          icon={HeartPulse}
          color="emerald"
        />
        <MetricCard
          title="Personal Leave"
          value={`${balances?.personal?.remaining ?? 6} Left`}
          subtitle={`Used ${balances?.personal?.used ?? 0} of 6 days`}
          icon={User}
          color="purple"
        />
      </div>

      {/* Leave History Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Leave Applications & History
        </h2>
        <DataTable
          columns={columns}
          data={leaves}
          loading={loading}
          searchPlaceholder="Search leave requests..."
        />
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply For Leave"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="applyLeaveForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </>
        }
      >
        <form id="applyLeaveForm" onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Classification *</label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Date *</label>
              <input
                type="date"
                required
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Date *</label>
              <input
                type="date"
                required
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State legitimate grounds for leave request..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
