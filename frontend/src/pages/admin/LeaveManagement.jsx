import React, { useState, useEffect } from 'react';
import leaveService from '../../services/leaveService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ErrorState from '../../components/ErrorState';
import {
  CalendarDays,
  Check,
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;

      const res = await leaveService.getAllLeaves(params);
      if (res.success) setLeaves(res.leaves || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await leaveService.approveLeave(selectedLeave._id, adminRemarks);
        setFeedback({ type: 'success', text: `Leave approved and attendance synchronized.` });
      } else {
        await leaveService.rejectLeave(selectedLeave._id, adminRemarks);
        setFeedback({ type: 'success', text: `Leave request declined.` });
      }
      setDecisionModalOpen(false);
      setAdminRemarks('');
      fetchLeaves();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.employee?.name || 'Unknown'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.employee?.employeeId || ''} • {row.employee?.department || ''}</p>
        </div>
      )
    },
    {
      header: 'Leave Type',
      accessor: 'leaveType',
      render: (row) => <span className="font-medium text-slate-800">{row.leaveType}</span>
    },
    {
      header: 'From Date',
      accessor: 'fromDate',
      render: (row) => <span className="font-mono text-xs text-slate-700">{row.fromDate}</span>
    },
    {
      header: 'To Date',
      accessor: 'toDate',
      render: (row) => <span className="font-mono text-xs text-slate-700">{row.toDate}</span>
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => <p className="text-xs text-slate-600 line-clamp-1 max-w-xs">{row.reason}</p>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Admin Remarks',
      accessor: 'adminRemarks',
      render: (row) => <span className="text-xs text-slate-500 italic">{row.adminRemarks || '—'}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'Pending' ? (
            <>
              <button
                onClick={() => {
                  setSelectedLeave(row);
                  setActionType('approve');
                  setAdminRemarks('Approved by Administration');
                  setDecisionModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => {
                  setSelectedLeave(row);
                  setActionType('reject');
                  setAdminRemarks('');
                  setDecisionModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-mono">Reviewed</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Leave Requests Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, approve, or reject employee leave applications with automatic attendance sync.
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200/80 w-fit">
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === status
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchLeaves} />
      ) : (
        <DataTable
          columns={columns}
          data={leaves}
          loading={loading}
          searchPlaceholder="Search leave applications..."
        />
      )}

      {/* Decision Review Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="leaveDecisionForm"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50 ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? 'Submitting Decision...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        {selectedLeave && (
          <form id="leaveDecisionForm" onSubmit={handleDecisionSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p><strong className="text-slate-900">Employee:</strong> {selectedLeave.employee?.name} ({selectedLeave.employee?.employeeId})</p>
              <p><strong className="text-slate-900">Type:</strong> {selectedLeave.leaveType}</p>
              <p><strong className="text-slate-900">Period:</strong> {selectedLeave.fromDate} to {selectedLeave.toDate}</p>
              <p><strong className="text-slate-900">Reason:</strong> {selectedLeave.reason}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Remarks / Feedback *
              </label>
              <textarea
                required
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter comments or justification for this decision..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
