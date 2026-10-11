import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import attendanceService from '../../services/attendanceService';
import taskService from '../../services/taskService';
import leaveService from '../../services/leaveService';
import announcementService from '../../services/announcementService';
import MetricCard from '../../components/MetricCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Clock,
  CheckCircle2,
  CalendarCheck,
  CheckSquare,
  FileText,
  CalendarDays,
  User,
  LogIn,
  LogOut,
  Coffee,
  AlertCircle,
  Megaphone,
  ArrowRight
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user, todayAttendance, refreshMe, updateWorkStatus } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [taskRes, leaveRes, annRes] = await Promise.all([
        taskService.getMyTasks(),
        leaveService.getMyLeaves(),
        announcementService.getAnnouncements()
      ]);

      if (taskRes.success) setTasks(taskRes.tasks || []);
      if (leaveRes.success) setLeaveBalances(leaveRes.balances);
      if (annRes.success) setAnnouncements(annRes.announcements || []);
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await attendanceService.checkIn();
      setFeedback({ type: 'success', text: res.message || 'Check-in successful.' });
      await refreshMe();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await attendanceService.checkOut();
      setFeedback({ type: 'success', text: res.message || 'Check-out successful.' });
      await refreshMe();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.length - completedTasks;
  const totalLeaveRemaining = (leaveBalances?.casual?.remaining || 0) + (leaveBalances?.sick?.remaining || 0) + (leaveBalances?.personal?.remaining || 0);

  const formatClock = (isoStr) => {
    if (!isoStr) return '--:--';
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <StatusBadge status={user?.workStatus || 'Offline'} showDot={true} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {user?.designation} • <span className="font-semibold text-blue-600">{user?.department}</span> • ID: <span className="font-mono font-semibold">{user?.employeeId}</span>
          </p>
        </div>

        {/* Quick Check In / Check Out Buttons (Section 9) */}
        <div className="flex items-center gap-2.5">
          {!todayAttendance?.checkIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{actionLoading ? 'Recording...' : 'Check In Now'}</span>
            </button>
          ) : !todayAttendance?.checkOut ? (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{actionLoading ? 'Recording...' : 'Check Out Now'}</span>
            </button>
          ) : (
            <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Shift Completed Today
            </div>
          )}
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

      {/* Cards Grid (Section 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Status"
          value={todayAttendance ? todayAttendance.status : 'Not Checked In'}
          subtitle={user?.workStatus ? `Work mode: ${user.workStatus}` : ''}
          icon={CalendarCheck}
          color="navy"
        />
        <MetricCard
          title="Check In Time"
          value={formatClock(todayAttendance?.checkIn)}
          subtitle="Official punch-in"
          icon={LogIn}
          color="emerald"
        />
        <MetricCard
          title="Check Out Time"
          value={formatClock(todayAttendance?.checkOut)}
          subtitle="Official punch-out"
          icon={LogOut}
          color="blue"
        />
        <MetricCard
          title="Working Hours"
          value={todayAttendance?.workingHoursFormatted || '0h 00m'}
          subtitle="Rendered today"
          icon={Clock}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned Tasks"
          value={tasks.length}
          subtitle="Active deliverables"
          icon={CheckSquare}
          color="blue"
        />
        <MetricCard
          title="Completed Tasks"
          value={completedTasks}
          subtitle="Finished deliverables"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Pending Tasks"
          value={pendingTasks}
          subtitle="Requires attention"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Leave Balance"
          value={`${totalLeaveRemaining} Days`}
          subtitle="Available PTO"
          icon={CalendarDays}
          color="purple"
        />
      </div>

      {/* Quick Actions (Section 8) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Quick Corporate Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/employee/tasks"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
          >
            <CheckSquare className="w-5 h-5 mx-auto text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">View Tasks</span>
          </Link>

          <Link
            to="/employee/work-report"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-200 transition text-center group"
          >
            <FileText className="w-5 h-5 mx-auto text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Submit Work Report</span>
          </Link>

          <Link
            to="/employee/leave"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 transition text-center group"
          >
            <CalendarDays className="w-5 h-5 mx-auto text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">Apply Leave</span>
          </Link>

          <Link
            to="/employee/attendance"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-200 transition text-center group"
          >
            <CalendarCheck className="w-5 h-5 mx-auto text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">My Attendance</span>
          </Link>

          <Link
            to="/employee/profile"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 transition text-center group col-span-2 sm:col-span-1"
          >
            <User className="w-5 h-5 mx-auto text-slate-700 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800">View Profile</span>
          </Link>
        </div>
      </div>

      {/* Announcements Broadcast Widget */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Company Announcements
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {announcements.length} Active Notice{announcements.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {announcements.slice(0, 3).map(ann => (
              <div key={ann._id} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{ann.title}</h3>
                  <StatusBadge status={ann.priority} />
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{ann.message}</p>
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Published: {new Date(ann.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
