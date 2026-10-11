import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import reportService from '../../services/reportService';
import MetricCard from '../../components/MetricCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Activity,
  CheckSquare,
  Clock,
  CheckCircle2,
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getDashboardMetrics();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating organization metrics..." size="lg" className="min-h-[50vh]" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const { metrics, employeeActivity = [], attendanceTrend = [], taskBreakdown = [], departmentDistribution = [], leaveBreakdown = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Corporate Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time workplace attendance, legitimate activity monitoring, and team deliverables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid (Section 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value={metrics?.totalEmployees ?? 0}
          icon={Users}
          color="navy"
          subtitle="Registered staff"
        />
        <MetricCard
          title="Present Today"
          value={metrics?.presentToday ?? 0}
          icon={UserCheck}
          color="emerald"
          subtitle="Checked-in"
        />
        <MetricCard
          title="Absent Today"
          value={metrics?.absentToday ?? 0}
          icon={UserX}
          color="rose"
          subtitle="Not checked in"
        />
        <MetricCard
          title="On Leave"
          value={metrics?.onLeaveToday ?? 0}
          icon={CalendarDays}
          color="purple"
          subtitle="Approved leaves"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Currently Working"
          value={metrics?.currentlyWorking ?? 0}
          icon={Activity}
          color="emerald"
          subtitle="Active on session"
        />
        <MetricCard
          title="Total Tasks"
          value={metrics?.totalTasks ?? 0}
          icon={CheckSquare}
          color="blue"
          subtitle="Assigned deliverables"
        />
        <MetricCard
          title="Pending Tasks"
          value={metrics?.pendingTasks ?? 0}
          icon={Clock}
          color="amber"
          subtitle="In progress / backlog"
        />
        <MetricCard
          title="Completed Tasks"
          value={metrics?.completedTasks ?? 0}
          icon={CheckCircle2}
          color="blue"
          subtitle="Successfully delivered"
        />
      </div>

      {/* Employee Activity Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Employee Workplace Activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, hours rendered today, and task delivery ratio
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-lg">
            {employeeActivity.length} Team Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Work Status</th>
                <th className="px-5 py-3">Hours Today</th>
                <th className="px-5 py-3">Tasks (Done/Total)</th>
                <th className="px-5 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                    No active employees registered yet. Go to Employees tab to create staff.
                  </td>
                </tr>
              ) : (
                employeeActivity.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.name}</p>
                          <p className="text-[11px] text-slate-500">{emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                      {emp.department}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={emp.status} showDot={true} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">
                      {emp.hours}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono">
                        {emp.tasksFormatted}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {emp.lastSeen
                        ? new Date(emp.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Offline'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section: Attendance & Working Hours Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Trend (Past 7 Days)</h3>
              <p className="text-xs text-slate-500">Present vs Absent vs Leave volume</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fillOpacity={1} fill="url(#presentGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" fillOpacity={1} fill="url(#absentGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Deliverables Status</h3>
              <p className="text-xs text-slate-500">Distribution across active states</p>
            </div>
            <CheckSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" name="Tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Department Distribution & Leave Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Workforce Distribution</h3>
              <p className="text-xs text-slate-500">Headcount allocation by team</p>
            </div>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-56 flex items-center justify-center">
            {departmentDistribution.length === 0 ? (
              <p className="text-xs text-slate-400">No departments configured yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Leave Applications Breakdown</h3>
              <p className="text-xs text-slate-500">Requests by leave classification</p>
            </div>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveBreakdown} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip />
                <Bar dataKey="value" name="Requests" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
