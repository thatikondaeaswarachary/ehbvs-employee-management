import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock,
  CalendarDays,
  FileText,
  UserCheck
} from 'lucide-react';

export default function EmployeeDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await employeeService.getEmployeeById(id);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading employee dossier..." size="lg" className="min-h-[50vh]" />;
  }

  if (error || !data?.employee) {
    return <ErrorState message={error || 'Employee not found.'} onRetry={fetchProfile} />;
  }

  const { employee, attendanceHistory = [], tasks = [], leaveHistory = [], workReports = [] } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Employees
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
              {employee.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{employee.name}</h1>
                <StatusBadge status={employee.isActive ? 'Active' : 'Disabled'} />
                <StatusBadge status={employee.workStatus || 'Offline'} showDot={true} />
              </div>
              <p className="text-sm font-medium text-slate-600">
                {employee.designation} • <span className="text-blue-600 font-semibold">{employee.department}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                  {employee.employeeId}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {employee.email}
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {employee.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {new Date(employee.joiningDate || employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Status</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {employee.todayAttendance?.status || 'Absent'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Hours</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {employee.workingHoursFormatted}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deliverables</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {employee.completedTasksCount}/{employee.tasksCount} done
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'attendance', label: 'Attendance Records', count: attendanceHistory.length, icon: UserCheck },
          { id: 'tasks', label: 'Assigned Tasks', count: tasks.length, icon: CheckCircle2 },
          { id: 'reports', label: 'Daily Work Reports', count: workReports.length, icon: FileText },
          { id: 'leaves', label: 'Leave History', count: leaveHistory.length, icon: CalendarDays }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="px-5 py-3">Check Out</th>
                  <th className="px-5 py-3">Working Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No attendance logged yet for this employee.
                    </td>
                  </tr>
                ) : (
                  attendanceHistory.map((att) => (
                    <tr key={att._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-slate-900">{att.date}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">
                        {att.workingHoursFormatted || '0h 00m'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={att.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{att.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Task ID</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Deadline</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No tasks assigned to this employee.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">{task.taskId}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{task.title}</td>
                      <td className="px-5 py-3"><StatusBadge status={task.priority} /></td>
                      <td className="px-5 py-3 font-mono text-slate-600">{task.deadline}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress || 0}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-slate-600">{task.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={task.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-3">
          {workReports.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
              No daily work reports submitted yet.
            </div>
          ) : (
            workReports.map((report) => (
              <div key={report._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-sm font-mono">{report.date}</span>
                  <span className="text-[11px] text-slate-400">Submitted report</span>
                </div>
                <div className="text-xs space-y-1.5 pt-1 text-slate-700">
                  <p><strong className="text-slate-900">Completed Work:</strong> {report.completedWork}</p>
                  {report.blockers && (
                    <p><strong className="text-rose-600">Blockers:</strong> {report.blockers}</p>
                  )}
                  {report.tomorrowPlan && (
                    <p><strong className="text-slate-900">Next Plan:</strong> {report.tomorrowPlan}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Leave Type</th>
                  <th className="px-5 py-3">From Date</th>
                  <th className="px-5 py-3">To Date</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Admin Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leaveHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No leave requests filed by this employee.
                    </td>
                  </tr>
                ) : (
                  leaveHistory.map((leave) => (
                    <tr key={leave._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-slate-800">{leave.leaveType}</td>
                      <td className="px-5 py-3 font-mono text-slate-600">{leave.fromDate}</td>
                      <td className="px-5 py-3 font-mono text-slate-600">{leave.toDate}</td>
                      <td className="px-5 py-3 text-slate-700">{leave.reason}</td>
                      <td className="px-5 py-3"><StatusBadge status={leave.status} /></td>
                      <td className="px-5 py-3 text-slate-500">{leave.adminRemarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
