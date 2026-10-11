import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import {
  UserPlus,
  Eye,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', data: null });

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    department: company.departments[0] || 'Engineering',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    password: '',
    role: 'EMPLOYEE'
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedDepartment !== 'All') params.department = selectedDepartment;
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await employeeService.getEmployees(params);
      if (res.success) {
        setEmployees(res.employees || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDepartment, selectedStatus]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await employeeService.createEmployee(formData);
      setFeedback({ type: 'success', text: `Employee ${formData.name} created successfully.` });
      setCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        department: company.departments[0] || 'Engineering',
        designation: 'Software Engineer',
        joiningDate: new Date().toISOString().split('T')[0],
        password: '',
        role: 'EMPLOYEE'
      });
      fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Creation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSubmitting(true);
    try {
      await employeeService.updateEmployee(editingEmployee._id, editingEmployee);
      setFeedback({ type: 'success', text: 'Employee details updated successfully.' });
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee || !newPassword) return;
    setSubmitting(true);
    try {
      await employeeService.resetPassword(editingEmployee._id, newPassword);
      setFeedback({ type: 'success', text: `Password reset successfully for ${editingEmployee.name}.` });
      setResetModalOpen(false);
      setNewPassword('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Password reset failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const { data: emp } = confirmDialog;
    if (!emp) return;
    setSubmitting(true);
    try {
      await employeeService.updateStatus(emp._id, !emp.isActive);
      setFeedback({
        type: 'success',
        text: `Employee ${emp.name} has been ${emp.isActive ? 'disabled' : 'activated'}.`
      });
      setConfirmDialog({ isOpen: false, type: '', data: null });
      fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Status change failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-800">
          {row.employeeId}
        </span>
      )
    },
    {
      header: 'Full Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department'
    },
    {
      header: 'Designation',
      accessor: 'designation'
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
          row.role === 'ADMIN'
            ? 'bg-purple-50 text-purple-700 border border-purple-200'
            : row.role === 'MANAGER'
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {row.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-purple-600" />}
          {row.role || 'EMPLOYEE'}
        </span>
      )
    },
    {
      header: 'Account Status',
      accessor: 'isActive',
      render: (row) => (
        <StatusBadge status={row.isActive ? 'Active' : 'Disabled'} />
      )
    },
    {
      header: 'Today Attendance',
      accessor: 'todayAttendance',
      render: (row) => (
        <StatusBadge status={row.todayAttendance || 'Absent'} showDot={true} />
      )
    },
    {
      header: 'Working Hours',
      accessor: 'workingHoursFormatted',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.workingHoursFormatted || '0h 00m'}
        </span>
      )
    },
    {
      header: 'Tasks',
      accessor: 'pendingTasks',
      render: (row) => (
        <span className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{row.completedTasks}</span>/{row.totalTasks} done
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/employees/${row._id}`}
            title="View Complete Profile"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              setEditingEmployee({ ...row });
              setEditModalOpen(true);
            }}
            title="Edit Details"
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingEmployee({ ...row });
              setResetModalOpen(true);
            }}
            title="Reset Password"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                type: 'toggleStatus',
                data: row
              });
            }}
            title={row.isActive ? 'Disable Employee' : 'Activate Employee'}
            className={`p-1.5 rounded-lg transition ${
              row.isActive
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {row.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Workforce Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain staff directory, configure credentials, track status, and audit permissions.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          Add New Employee
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
        <ErrorState message={error} onRetry={fetchEmployees} />
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          searchPlaceholder="Search by ID, name, email, or department..."
          actions={
            <div className="flex items-center gap-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="All">All Departments</option>
                {company.departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Disabled Only</option>
              </select>
            </div>
          }
        />
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Employee"
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="createEmployeeForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Creating Profile...' : 'Save Employee'}
            </button>
          </>
        }
      >
        <form id="createEmployeeForm" onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="priya@ehbvssolutions.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono uppercase"
                placeholder="EHB-1002"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="+91 98765 00000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                {company.departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Employee Information"
        maxWidth="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="editEmployeeForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Employee'}
            </button>
          </>
        }
      >
        {editingEmployee && (
          <form id="editEmployeeForm" onSubmit={handleEditSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingEmployee.name || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingEmployee.email || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="employee@ehbvssolutions.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Access Level *</label>
                <select
                  value={editingEmployee.role || 'EMPLOYEE'}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Staff Member)</option>
                  <option value="ADMIN">ADMIN (Full System Administrator)</option>
                  <option value="MANAGER">MANAGER (Department Head)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={editingEmployee.employeeId || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeId: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editingEmployee.phone || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editingEmployee.department || company.departments[0]}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {company.departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={editingEmployee.designation || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={editingEmployee.joiningDate ? editingEmployee.joiningDate.split('T')[0] : ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password for ${editingEmployee?.name || 'Employee'}`}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="resetPasswordForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Set New Password'}
            </button>
          </>
        }
      >
        <form id="resetPasswordForm" onSubmit={handleResetSubmit} className="space-y-3">
          <p className="text-xs text-slate-500">
            Specify a secure replacement password for employee <span className="font-semibold">{editingEmployee?.employeeId}</span>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivation / Activation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: '', data: null })}
        onConfirm={handleToggleStatus}
        title={confirmDialog.data?.isActive ? 'Disable Employee Account' : 'Activate Employee Account'}
        message={
          confirmDialog.data?.isActive
            ? `Are you sure you want to disable ${confirmDialog.data?.name}'s account? They will immediately lose access to all corporate portals.`
            : `Are you sure you want to re-activate ${confirmDialog.data?.name}'s account?`
        }
        confirmText={confirmDialog.data?.isActive ? 'Yes, Disable' : 'Yes, Activate'}
        confirmVariant={confirmDialog.data?.isActive ? 'danger' : 'primary'}
        loading={submitting}
      />
    </div>
  );
}
