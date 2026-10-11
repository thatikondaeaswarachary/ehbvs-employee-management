import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import employeeService from '../../services/employeeService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import {
  BarChart3,
  Download,
  CalendarCheck,
  Clock,
  CheckSquare,
  CalendarDays,
  FileText,
  Users,
  Calendar
} from 'lucide-react';

export default function AdminReports() {
  const [activeReport, setActiveReport] = useState('attendance'); // 'attendance', 'work-hours', 'tasks', 'leave', 'work-reports', 'employees'
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmp, setSelectedEmp] = useState('All');

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedDept !== 'All') params.department = selectedDept;
      if (selectedEmp !== 'All') params.employeeId = selectedEmp;

      let res;
      if (activeReport === 'attendance') {
        res = await reportService.getAttendanceReport(params);
      } else if (activeReport === 'work-hours') {
        res = await reportService.getWorkHoursReport(params);
      } else if (activeReport === 'tasks') {
        res = await reportService.getTaskReport(params);
      } else if (activeReport === 'leave') {
        res = await reportService.getLeaveReport(params);
      } else if (activeReport === 'employees') {
        res = await reportService.getEmployeeSummaryReport(params);
      }

      if (res?.success) {
        setData(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    employeeService.getEmployees().then(res => {
      if (res.success) setEmployees(res.employees || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeReport, startDate, endDate, selectedDept, selectedEmp]);

  const handleDownloadCsv = async () => {
    try {
      const type = activeReport === 'work-hours' ? 'work-hours' : activeReport;
      await reportService.downloadCsv(type);
    } catch (err) {
      alert('Failed to export CSV report: ' + err.message);
    }
  };

  // Define dynamic columns based on active report
  let columns = [];
  if (activeReport === 'attendance') {
    columns = [
      { header: 'Date', accessor: 'date', render: r => <span className="font-mono font-semibold">{r.date}</span> },
      { header: 'Employee ID', accessor: 'employeeId', render: r => <span className="font-mono text-slate-700">{r.employeeId}</span> },
      { header: 'Employee Name', accessor: 'employeeName' },
      { header: 'Department', accessor: 'department' },
      { header: 'Check In', accessor: 'checkIn' },
      { header: 'Check Out', accessor: 'checkOut' },
      { header: 'Working Hours', accessor: 'workingHours', render: r => <span className="font-mono font-bold text-slate-900">{r.workingHours}</span> },
      { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
      { header: 'Remarks', accessor: 'remarks' }
    ];
  } else if (activeReport === 'work-hours') {
    columns = [
      { header: 'Employee ID', accessor: 'employeeId', render: r => <span className="font-mono font-semibold">{r.employeeId}</span> },
      { header: 'Name', accessor: 'name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Days Present', accessor: 'daysWorked', render: r => <span className="font-semibold text-slate-900">{r.daysWorked}</span> },
      { header: 'Total Hours Rendered', accessor: 'totalWorkingHoursFormatted', render: r => <span className="font-mono font-bold text-slate-900">{r.totalWorkingHoursFormatted}</span> },
      { header: 'Daily Average', accessor: 'averageDailyHoursFormatted', render: r => <span className="font-mono text-slate-700">{r.averageDailyHoursFormatted}</span> }
    ];
  } else if (activeReport === 'tasks') {
    columns = [
      { header: 'Task ID', accessor: 'taskId', render: r => <span className="font-mono font-bold">{r.taskId}</span> },
      { header: 'Title', accessor: 'title' },
      { header: 'Assigned Employee', accessor: 'assignedEmployee' },
      { header: 'Department', accessor: 'department' },
      { header: 'Priority', accessor: 'priority', render: r => <StatusBadge status={r.priority} /> },
      { header: 'Progress', accessor: 'progress', render: r => <span className="font-mono">{r.progress}</span> },
      { header: 'Deadline', accessor: 'deadline', render: r => <span className="font-mono">{r.deadline}</span> },
      { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> }
    ];
  } else if (activeReport === 'leave') {
    columns = [
      { header: 'Employee', accessor: 'employeeName' },
      { header: 'Department', accessor: 'department' },
      { header: 'Leave Type', accessor: 'leaveType' },
      { header: 'From Date', accessor: 'fromDate', render: r => <span className="font-mono">{r.fromDate}</span> },
      { header: 'To Date', accessor: 'toDate', render: r => <span className="font-mono">{r.toDate}</span> },
      { header: 'Reason', accessor: 'reason' },
      { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
      { header: 'Admin Remarks', accessor: 'adminRemarks' }
    ];
  } else if (activeReport === 'employees') {
    columns = [
      { header: 'Employee ID', accessor: 'employeeId', render: r => <span className="font-mono font-semibold">{r.employeeId}</span> },
      { header: 'Name', accessor: 'name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Tasks Completed', accessor: 'tasksCompleted', render: r => <span className="font-mono font-bold text-emerald-700">{r.tasksCompleted}/{r.tasksTotal}</span> },
      { header: 'Tasks On Time', accessor: 'tasksOnTime', render: r => <span className="font-mono text-slate-700">{r.tasksOnTime}</span> },
      { header: 'Reports Filed', accessor: 'reportsSubmitted', render: r => <span className="font-mono text-slate-700">{r.reportsSubmitted}</span> },
      { header: 'Days Present', accessor: 'attendancePresentDays', render: r => <span className="font-mono font-bold text-blue-600">{r.attendancePresentDays}</span> },
      { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> }
    ];
  }

  const reportTabs = [
    { id: 'attendance', label: '1. Attendance Report', icon: CalendarCheck },
    { id: 'work-hours', label: '2. Working Hours Report', icon: Clock },
    { id: 'tasks', label: '3. Task Deliverables Report', icon: CheckSquare },
    { id: 'leave', label: '4. Leave Applications Report', icon: CalendarDays },
    { id: 'employees', label: '5. Employee Performance Summary', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Corporate Analytics & Exportable Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate filtered workplace audits and download compliance CSV files.
          </p>
        </div>
        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          Export Active Report to CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeReport === tab.id
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          >
            <option value="All">All Departments</option>
            {company.departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedDept('All');
              setSelectedEmp('All');
            }}
            className="w-full py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchReportData} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          searchPlaceholder="Search report data..."
        />
      )}
    </div>
  );
}
