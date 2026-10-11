import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import taskService from '../../services/taskService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ErrorState from '../../components/ErrorState';
import { CheckSquare, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await taskService.getMyTasks(params);
      if (res.success) {
        setTasks(res.tasks || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [statusFilter]);

  const columns = [
    {
      header: 'Task ID',
      accessor: 'taskId',
      render: (row) => <span className="font-mono font-bold text-slate-800">{row.taskId}</span>
    },
    {
      header: 'Deliverable Title',
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
          {row.isOverdue && (
            <span className="text-[10px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-semibold uppercase">
              Overdue
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
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
      header: 'Action',
      render: (row) => (
        <Link
          to={`/employee/tasks/${row._id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
        >
          <span>Open Task</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Assigned Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your milestones, update progress percentages, and log status transitions.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200/80 w-fit">
        {['All', 'In Progress', 'Not Started', 'Completed', 'On Hold'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchMyTasks} />
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          loading={loading}
          searchPlaceholder="Search my tasks..."
        />
      )}
    </div>
  );
}
