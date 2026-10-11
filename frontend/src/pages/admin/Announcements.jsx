import React, { useState, useEffect } from 'react';
import announcementService from '../../services/announcementService';
import employeeService from '../../services/employeeService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import { Megaphone, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'All Employees',
    department: '',
    employee: '',
    priority: 'Medium'
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [annRes, empRes] = await Promise.all([
        announcementService.getAnnouncements(),
        employeeService.getEmployees()
      ]);
      if (annRes.success) setAnnouncements(annRes.announcements || []);
      if (empRes.success) setEmployees(empRes.employees || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementService.createAnnouncement(formData);
      setFeedback({ type: 'success', text: 'Announcement broadcasted successfully to targeted team members.' });
      setCreateModalOpen(false);
      setFormData({
        title: '',
        message: '',
        audience: 'All Employees',
        department: '',
        employee: '',
        priority: 'Medium'
      });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Publishing failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    setSubmitting(true);
    try {
      await announcementService.deleteAnnouncement(selectedAnnouncement._id);
      setFeedback({ type: 'success', text: 'Announcement deleted.' });
      setDeleteConfirmOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => <span className="font-semibold text-slate-900">{row.title}</span>
    },
    {
      header: 'Audience Scope',
      accessor: 'audience',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {row.audience} {row.department ? `(${row.department})` : ''}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <StatusBadge status={row.priority} />
    },
    {
      header: 'Date Published',
      accessor: 'createdAt',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedAnnouncement(row);
            setDeleteConfirmOpen(true);
          }}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Delete Announcement"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Company Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Broadcast official organizational communications, policy updates, and team alerts.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Publish Announcement
        </button>
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

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          columns={columns}
          data={announcements}
          loading={loading}
          searchPlaceholder="Search announcements..."
        />
      )}

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Broadcast New Announcement"
        maxWidth="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="createAnnouncementForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Broadcasting...' : 'Publish Announcement'}
            </button>
          </>
        }
      >
        <form id="createAnnouncementForm" onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Q4 Town Hall Meeting & Deliverables Review"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content *</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Announcement details, schedule, or instructions..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="All Employees">All Employees</option>
                <option value="Department">Specific Department</option>
                <option value="Specific Employee">Specific Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {formData.audience === 'Department' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">-- Choose Department --</option>
                {company.departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {formData.audience === 'Specific Employee' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee</label>
              <select
                required
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to remove announcement "${selectedAnnouncement?.title}"?`}
        confirmText="Yes, Delete"
        confirmVariant="danger"
        loading={submitting}
      />
    </div>
  );
}
