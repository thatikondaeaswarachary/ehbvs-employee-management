import React, { useState, useEffect } from 'react';
import workReportService from '../../services/workReportService';
import taskService from '../../services/taskService';
import DataTable from '../../components/DataTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { FileText, Send, CheckCircle2, AlertCircle, History, Sparkles } from 'lucide-react';

export default function EmployeeWorkReport() {
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    completedWork: '',
    tasksWorkedOn: '',
    blockers: '',
    tomorrowPlan: '',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repRes, taskRes] = await Promise.all([
        workReportService.getMyReports(),
        taskService.getMyTasks()
      ]);
      if (repRes.success) setReports(repRes.reports || []);
      if (taskRes.success) setTasks(taskRes.tasks || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.completedWork.trim()) {
      setFeedback({ type: 'error', text: 'Please detail the work completed today.' });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        tasksWorkedOn: formData.tasksWorkedOn ? formData.tasksWorkedOn.split(',').map(s => s.trim()) : []
      };

      await workReportService.submitReport(payload);
      setFeedback({ type: 'success', text: 'Daily work report successfully submitted and recorded.' });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        completedWork: '',
        tasksWorkedOn: '',
        blockers: '',
        tomorrowPlan: '',
        remarks: ''
      });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Report Date',
      accessor: 'date',
      render: r => <span className="font-mono font-semibold text-slate-900">{r.date}</span>
    },
    {
      header: 'Completed Work',
      accessor: 'completedWork',
      render: r => <p className="text-xs text-slate-700 line-clamp-2 max-w-md">{r.completedWork}</p>
    },
    {
      header: 'Blockers',
      accessor: 'blockers',
      render: r => (
        <span className={`text-xs ${r.blockers ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
          {r.blockers || 'None'}
        </span>
      )
    },
    {
      header: 'Tomorrow Plan',
      accessor: 'tomorrowPlan',
      render: r => <p className="text-xs text-slate-600 line-clamp-1">{r.tomorrowPlan || '—'}</p>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Work Report Submission
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit your end-of-day operational summary, blockers, and tomorrow's roadmap.
          </p>
        </div>
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

      {/* Submission Form (Section 14) */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            File Today's Daily Work Report
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Report Date:</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-mono font-semibold text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Work Completed Today *
          </label>
          <textarea
            required
            rows={4}
            value={formData.completedWork}
            onChange={(e) => setFormData({ ...formData, completedWork: e.target.value })}
            placeholder="Bullet points or concise overview of achievements, feature updates, bug fixes, or deliverables delivered today..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tasks Worked On (IDs or Titles)
            </label>
            <input
              type="text"
              value={formData.tasksWorkedOn}
              onChange={(e) => setFormData({ ...formData, tasksWorkedOn: e.target.value })}
              placeholder="e.g. TSK-1001, API Integration, Unit Tests"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
            {tasks.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">
                Your active tasks: {tasks.map(t => t.taskId).slice(0, 4).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              Problems, Blockers or Impediments
            </label>
            <input
              type="text"
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              placeholder="Leave blank if none; or state pending access, API delays..."
              className="w-full px-3 py-2 text-xs border border-rose-200 rounded-xl bg-rose-50/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tomorrow's Action Plan
            </label>
            <textarea
              rows={2}
              value={formData.tomorrowPlan}
              onChange={(e) => setFormData({ ...formData, tomorrowPlan: e.target.value })}
              placeholder="Key objectives planned for the next working shift..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Any other operational notes..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting Report...' : 'Submit Work Report'}</span>
          </button>
        </div>
      </form>

      {/* Historical Submissions Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          My Previously Submitted Work Reports
        </h2>

        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          searchPlaceholder="Search past submissions..."
        />
      </div>
    </div>
  );
}
