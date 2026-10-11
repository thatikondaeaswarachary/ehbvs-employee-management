import React, { useState, useEffect } from 'react';
import workReportService from '../../services/workReportService';
import employeeService from '../../services/employeeService';
import reportService from '../../services/reportService';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import { FileText, Download, Eye, Calendar, User, AlertCircle } from 'lucide-react';

export default function AdminWorkReports() {
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');

  // View modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterDepartment !== 'All') params.department = filterDepartment;
      if (filterEmployee !== 'All') params.employeeId = filterEmployee;

      const [repRes, empRes] = await Promise.all([
        workReportService.getAllReports(params),
        employeeService.getEmployees()
      ]);

      if (repRes.success) setReports(repRes.reports || []);
      if (empRes.success) setEmployees(empRes.employees || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch work reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterDate, filterDepartment, filterEmployee]);

  const handleExportCsv = async () => {
    try {
      await reportService.downloadCsv('work-reports');
    } catch (err) {
      alert('Failed to download CSV export.');
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-mono font-semibold text-slate-900">{row.date}</span>
    },
    {
      header: 'Employee',
      accessor: 'employee',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.employee?.name || 'Unknown'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.employee?.employeeId || ''}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <span className="text-xs text-slate-600">{row.employee?.department || '—'}</span>
    },
    {
      header: 'Completed Work Summary',
      accessor: 'completedWork',
      render: (row) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-md">{row.completedWork}</p>
      )
    },
    {
      header: 'Blockers Reported',
      accessor: 'blockers',
      render: (row) => (
        <span className={`text-xs ${row.blockers ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
          {row.blockers ? row.blockers.slice(0, 40) + '...' : 'None'}
        </span>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedReport(row);
            setViewModalOpen(true);
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="View Full Report"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Work Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review end-of-day progress submissions, blockers, and tomorrow's plans across all departments.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          Export Reports CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          >
            <option value="All">All Departments</option>
            {company.departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          >
            <option value="All">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
            ))}
          </select>
        </div>
        {(filterDate || filterDepartment !== 'All' || filterEmployee !== 'All') && (
          <button
            onClick={() => {
              setFilterDate('');
              setFilterDepartment('All');
              setFilterEmployee('All');
            }}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchReports} />
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          searchPlaceholder="Search work reports..."
        />
      )}

      {/* View Full Report Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Work Report Detail"
        maxWidth="max-w-lg"
        footer={
          <button
            type="button"
            onClick={() => setViewModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedReport.employee?.name}</p>
                <p className="text-slate-500 font-mono">{selectedReport.employee?.employeeId} • {selectedReport.employee?.department}</p>
              </div>
              <span className="font-mono px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700">
                {selectedReport.date}
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Work Completed Today</span>
              <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedReport.completedWork}
              </p>
            </div>

            {selectedReport.blockers && (
              <div className="space-y-1">
                <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px]">Problems / Blockers Encountered</span>
                <p className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-rose-900 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.blockers}
                </p>
              </div>
            )}

            {selectedReport.tomorrowPlan && (
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tomorrow's Action Plan</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.tomorrowPlan}
                </p>
              </div>
            )}

            {selectedReport.remarks && (
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Additional Remarks</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 italic">
                  {selectedReport.remarks}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
