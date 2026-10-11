import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import taskService from '../../services/taskService';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export default function EmployeeTaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await taskService.getTaskById(id);
      if (res.success && res.task) {
        setTask(res.task);
        setStatus(res.task.status);
        setProgress(res.task.progress || 0);
        setRemarks(res.task.remarks || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await taskService.updateTaskStatus(id, {
        status,
        progress: Number(progress),
        remarks
      });
      setTask(res.task);
      setFeedback({ type: 'success', text: 'Task progress updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTask = async () => {
    setStatus('In Progress');
    setProgress(prev => Math.max(10, prev));
    setSubmitting(true);
    try {
      const res = await taskService.updateTaskStatus(id, {
        status: 'In Progress',
        progress: Math.max(10, progress)
      });
      setTask(res.task);
      setFeedback({ type: 'success', text: 'Task started! Status set to In Progress.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCompleted = async () => {
    setStatus('Completed');
    setProgress(100);
    setSubmitting(true);
    try {
      const res = await taskService.updateTaskStatus(id, {
        status: 'Completed',
        progress: 100,
        remarks: remarks || 'Deliverable marked complete.'
      });
      setTask(res.task);
      setFeedback({ type: 'success', text: 'Congratulations! Deliverable marked completed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading task details..." size="lg" className="min-h-[50vh]" />;
  }

  if (error || !task) {
    return <ErrorState message={error || 'Task not found.'} onRetry={fetchTask} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/employee/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tasks
        </Link>
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

      {/* Main Task Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">
              {task.taskId}
            </span>
            <StatusBadge status={task.priority} />
            <StatusBadge status={task.status} />
          </div>

          <div className="flex items-center gap-2">
            {task.status !== 'In Progress' && task.status !== 'Completed' && (
              <button
                onClick={handleStartTask}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Play className="w-3.5 h-3.5" /> Start Task
              </button>
            )}

            {task.status !== 'Completed' && (
              <button
                onClick={handleMarkCompleted}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
              </button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Department: <span className="font-semibold text-slate-700">{task.department}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Start Date</span>
            <p className="font-mono font-semibold text-slate-800 mt-0.5">{task.startDate || '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Deadline</span>
            <p className={`font-mono font-semibold mt-0.5 ${task.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
              {task.deadline} {task.isOverdue && '(Overdue)'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Current Progress</span>
            <p className="font-mono font-semibold text-blue-600 mt-0.5">{task.progress || 0}%</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Assigned To</span>
            <p className="font-semibold text-slate-800 mt-0.5">{task.assignedTo?.name || 'Self'}</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Deliverable Description & Specifications
          </h3>
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {task.description || 'No detailed instructions provided.'}
          </div>
        </div>
      </div>

      {/* Progress Update Card */}
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Update Progress & Status
        </h2>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Progress Completion Percentage</span>
            <span className="font-mono text-blue-600 font-bold text-sm">{progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>0% (Not Started)</span>
            <span>50% (In Progress)</span>
            <span>100% (Completed)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Transition</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Progress Notes / Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add note on current status, blockers or completion comments..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Progress...' : 'Save Updates'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
