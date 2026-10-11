import React, { useState, useEffect } from 'react';
import taskService from '../../services/taskService';
import employeeService from '../../services/employeeService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import MetricCard from '../../components/MetricCard';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    department: company.departments[0] || 'Engineering',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'Not Started',
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterPriority !== 'All') params.priority = filterPriority;
      if (filterDepartment !== 'All') params.department = filterDepartment;

      const [taskRes, empRes] = await Promise.all([
        taskService.getTasks(params),
        employeeService.getEmployees()
      ]);

      if (taskRes.success) setTasks(taskRes.tasks || []);
      if (empRes.success) {
        setEmployees(empRes.employees || []);
        if (empRes.employees?.length > 0 && !formData.assignedTo) {
          setFormData(prev => ({ ...prev, assignedTo: empRes.employees[0]._id }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPriority, filterDepartment]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await taskService.createTask(formData);
      setFeedback({ type: 'success', text: `Task created and assigned successfully.` });
      setCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        assignedTo: employees[0]?._id || '',
        department: company.departments[0] || 'Engineering',
        priority: 'Medium',
        startDate: new Date().toISOString().split('T')[0],
        deadline: '',
        status: 'Not Started',
        remarks: ''
      });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Task creation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await taskService.updateTask(selectedTask._id, {
        title: selectedTask.title,
        description: selectedTask.description,
        assignedTo: selectedTask.assignedTo?._id || selectedTask.assignedTo,
        department: selectedTask.department,
        priority: selectedTask.priority,
        deadline: selectedTask.deadline,
        status: selectedTask.status,
        progress: selectedTask.progress,
        remarks: selectedTask.remarks
      });
      setFeedback({ type: 'success', text: 'Task updated successfully.' });
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Task update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await taskService.deleteTask(selectedTask._id);
      setFeedback({ type: 'success', text: `Task ${selectedTask.taskId} removed.` });
      setDeleteConfirmOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Deletion failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalAssigned = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => t.isOverdue).length;

  const columns = [
    {
      header: 'Task ID',
      accessor: 'taskId',
      render: (row) => <span className="font-mono font-bold text-slate-800">{row.taskId}</span>
    },
    {
      header: 'Title & Summary',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.title}</p>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
          )}
        </div>
      )
    },
    {
      header: 'Assigned To',
      accessor: 'assignedTo',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.assignedTo?.name || 'Unassigned'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.assignedTo?.employeeId || ''}</p>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <StatusBadge status={row.priority} />
    },
    {
      header: 'Deadline',
      accessor: 'deadline',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className={row.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
            {row.deadline}
          </span>
          {row.isOverdue && <span className="text-[10px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-semibold uppercase">Overdue</span>}
        </div>
      )
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${row.progress || 0}%` }} />
          </div>
          <span className="font-mono text-xs text-slate-600">{row.progress || 0}%</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedTask({ ...row });
              setEditModalOpen(true);
            }}
            title="Edit Task"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedTask(row);
              setDeleteConfirmOpen(true);
            }}
            title="Delete Task"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Work Deliverables & Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign work, track completion percentages, manage deadlines, and audit task statuses.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Create New Task
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

      {/* Task Dashboard Cards (Section 12) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard title="Assigned Tasks" value={totalAssigned} icon={CheckSquare} color="navy" subtitle="Total tasks" />
        <MetricCard title="In Progress" value={inProgress} icon={Clock} color="blue" subtitle="Under active work" />
        <MetricCard title="Completed" value={completed} icon={CheckCircle2} color="emerald" subtitle="Finalized items" />
        <MetricCard title="Overdue Tasks" value={overdue} icon={AlertTriangle} color="rose" subtitle="Past deadline" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="All">All Statuses</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
        >
          <option value="All">All Departments</option>
          {company.departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          loading={loading}
          searchPlaceholder="Search tasks by ID, title, or assignee..."
        />
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Assign New Task"
        maxWidth="max-w-xl"
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
              form="createTaskForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign Deliverable'}
            </button>
          </>
        }
      >
        <form id="createTaskForm" onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Build REST API for Attendance Synchronization"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Technical objectives, acceptance criteria, or reference notes..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To Employee *</label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId} - {emp.department})
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Task: ${selectedTask?.taskId}`}
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="editTaskForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {selectedTask && (
          <form id="editTaskForm" onSubmit={handleEditSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={selectedTask.title}
                onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={selectedTask.description || ''}
                onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
                <select
                  value={selectedTask.assignedTo?._id || selectedTask.assignedTo}
                  onChange={(e) => setSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                >
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setSelectedTask({
                      ...selectedTask,
                      status: newStatus,
                      progress: newStatus === 'Completed' ? 100 : selectedTask.progress
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Progress ({selectedTask.progress || 0}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedTask.progress || 0}
                  onChange={(e) => setSelectedTask({ ...selectedTask, progress: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={selectedTask.deadline}
                  onChange={(e) => setSelectedTask({ ...selectedTask, deadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTask}
        title="Delete Deliverable Task"
        message={`Are you sure you want to delete task ${selectedTask?.taskId} ("${selectedTask?.title}")?`}
        confirmText="Yes, Delete Task"
        confirmVariant="danger"
        loading={submitting}
      />
    </div>
  );
}
