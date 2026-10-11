import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import reportService from '../../services/reportService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ErrorState from '../../components/ErrorState';
import { company } from '../../config/company';
import {
  CalendarCheck,
  Download,
  Filter,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  UserCheck,
  Clock
} from 'lucide-react';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');

  // Edit record state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Mark record state
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markData, setMarkData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkIn: '09:00',
    checkOut: '18:00',
    workingMinutes: 540,
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterMonth) params.month = filterMonth;
      if (filterDepartment !== 'All') params.department = filterDepartment;
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterEmployee !== 'All') params.employeeId = filterEmployee;

      const [attRes, empRes] = await Promise.all([
        attendanceService.getAllAttendance(params),
        employeeService.getEmployees()
      ]);

      if (attRes.success) setRecords(attRes.records || []);
      if (empRes.success) setEmployees(empRes.employees || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterMonth, filterDepartment, filterStatus, filterEmployee]);

  const getTimeString = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const openEditRecord = (row) => {
    const cin = getTimeString(row.checkIn) || '09:00';
    const cout = getTimeString(row.checkOut) || '18:00';
    setEditingRecord({
      ...row,
      checkInTime: cin,
      checkOutTime: cout,
      customMinutes: row.workingMinutes ?? 480
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      const isOff = ['Absent', 'Leave', 'Holiday'].includes(editingRecord.status);
      await attendanceService.updateAttendanceRecord(editingRecord._id, {
        date: editingRecord.date,
        status: editingRecord.status,
        checkIn: isOff ? null : editingRecord.checkInTime,
        checkOut: isOff ? null : editingRecord.checkOutTime,
        remarks: editingRecord.remarks,
        workingMinutes: isOff ? 0 : Number(editingRecord.customMinutes)
      });
      setFeedback({
        type: 'success',
        text: `Attendance for ${editingRecord.employee?.name || 'employee'} on ${editingRecord.date} updated successfully.`
      });
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    if (!markData.employeeId) {
      setFeedback({ type: 'error', text: 'Please select an employee.' });
      return;
    }
    setSubmitting(true);
    try {
      const isOff = ['Absent', 'Leave', 'Holiday'].includes(markData.status);
      await attendanceService.adminMarkAttendance({
        employeeId: markData.employeeId,
        date: markData.date,
        status: markData.status,
        checkIn: isOff ? null : markData.checkIn,
        checkOut: isOff ? null : markData.checkOut,
        workingMinutes: isOff ? 0 : Number(markData.workingMinutes),
        remarks: markData.remarks
      });
      setFeedback({ type: 'success', text: `Attendance record successfully marked for ${markData.date}.` });
      setMarkModalOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to mark attendance.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await reportService.downloadCsv('attendance');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to download CSV export.' });
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
      header: 'Check In',
      accessor: 'checkIn',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
      )
    },
    {
      header: 'Check Out',
      accessor: 'checkOut',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
      )
    },
    {
      header: 'Hours Rendered',
      accessor: 'workingHoursFormatted',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {row.workingHoursFormatted || '0h 00m'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEditRecord(row);
          }}
          className="cursor-pointer hover:opacity-80 transition transform active:scale-95"
          title="Click to update status"
        >
          <StatusBadge status={row.status} />
        </button>
      )
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      render: (row) => <span className="text-xs text-slate-500 italic">{row.remarks || '—'}</span>
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEditRecord(row);
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Edit Attendance Record"
        >
          <Edit2 className="w-4 h-4" />
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
            Workplace Attendance Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor daily check-ins, record manual attendance, update records with audit logs, and export reports.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setMarkData({
                employeeId: employees[0]?._id || '',
                date: new Date().toISOString().split('T')[0],
                status: 'Present',
                checkIn: '09:00',
                checkOut: '18:00',
                workingMinutes: 540,
                remarks: ''
              });
              setMarkModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
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
          <button onClick={() => setFeedback({ type: '', text: '' })} className="underline text-[11px] font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Specific Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setFilterMonth('');
            }}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month Filter</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setFilterDate('');
            }}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          >
            <option value="All">All Departments</option>
            {company.departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Half Day">Half Day</option>
            <option value="Leave">Leave</option>
            <option value="Absent">Absent</option>
            <option value="Holiday">Holiday</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterDate('');
              setFilterMonth('');
              setFilterDepartment('All');
              setFilterStatus('All');
              setFilterEmployee('All');
            }}
            className="w-full py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <div className="relative">
          <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between px-1">
            <span>💡 Tip: Click on any attendance row or status badge to view & update record</span>
            <span>Total Records: <strong className="text-slate-700">{records.length}</strong></span>
          </div>
          <DataTable
            columns={columns}
            data={records}
            loading={loading}
            onRowClick={(row) => openEditRecord(row)}
            searchPlaceholder="Search attendance records by employee or date..."
          />
        </div>
      )}

      {/* Edit Attendance Record Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Attendance Record"
        maxWidth="max-w-md"
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
              form="editAttendanceForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editingRecord && (
          <form id="editAttendanceForm" onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{editingRecord.employee?.name || 'Employee'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editingRecord.employee?.employeeId} • {editingRecord.employee?.department}
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {editingRecord.date}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Status *</label>
              <select
                value={editingRecord.status}
                onChange={(e) => {
                  const s = e.target.value;
                  let mins = editingRecord.customMinutes;
                  if (s === 'Present') mins = 480;
                  else if (s === 'Half Day') mins = 240;
                  else mins = 0;
                  setEditingRecord({ ...editingRecord, status: s, customMinutes: mins });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Present">Present (Full Working Day)</option>
                <option value="Half Day">Half Day (Partial Shift)</option>
                <option value="Leave">Leave (Approved Leave)</option>
                <option value="Absent">Absent (Not Reported)</option>
                <option value="Holiday">Holiday (Public / Company Holiday)</option>
              </select>
            </div>

            {!['Absent', 'Leave', 'Holiday'].includes(editingRecord.status) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={editingRecord.checkInTime}
                    onChange={(e) => {
                      const t = e.target.value;
                      setEditingRecord(prev => {
                        let mins = prev.customMinutes;
                        if (t && prev.checkOutTime) {
                          const [sh, sm] = t.split(':').map(Number);
                          const [eh, em] = prev.checkOutTime.split(':').map(Number);
                          const diff = (eh * 60 + em) - (sh * 60 + sm);
                          if (diff > 0) mins = diff;
                        }
                        return { ...prev, checkInTime: t, customMinutes: mins };
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={editingRecord.checkOutTime}
                    onChange={(e) => {
                      const t = e.target.value;
                      setEditingRecord(prev => {
                        let mins = prev.customMinutes;
                        if (prev.checkInTime && t) {
                          const [sh, sm] = prev.checkInTime.split(':').map(Number);
                          const [eh, em] = t.split(':').map(Number);
                          const diff = (eh * 60 + em) - (sh * 60 + sm);
                          if (diff > 0) mins = diff;
                        }
                        return { ...prev, checkOutTime: t, customMinutes: mins };
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Working Duration (Minutes)</label>
                <span className="text-[11px] font-bold text-blue-600 font-mono">
                  {Math.floor((editingRecord.customMinutes || 0) / 60)}h {((editingRecord.customMinutes || 0) % 60).toString().padStart(2, '0')}m
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={editingRecord.customMinutes}
                onChange={(e) => setEditingRecord({ ...editingRecord, customMinutes: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note (Optional)</label>
              <textarea
                rows={2}
                value={editingRecord.remarks || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                placeholder="Audit notes or reason for correction..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Mark New Attendance Modal */}
      <Modal
        isOpen={markModalOpen}
        onClose={() => setMarkModalOpen(false)}
        title="Mark Attendance for Employee"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setMarkModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="markAttendanceForm"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Marking...' : 'Save Attendance'}
            </button>
          </>
        }
      >
        <form id="markAttendanceForm" onSubmit={handleMarkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
            <select
              required
              value={markData.employeeId}
              onChange={(e) => setMarkData({ ...markData, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId || 'ID'}) - {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={markData.date}
                onChange={(e) => setMarkData({ ...markData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={markData.status}
                onChange={(e) => {
                  const s = e.target.value;
                  let mins = markData.workingMinutes;
                  if (s === 'Present') mins = 540;
                  else if (s === 'Half Day') mins = 240;
                  else mins = 0;
                  setMarkData({ ...markData, status: s, workingMinutes: mins });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Present">Present</option>
                <option value="Half Day">Half Day</option>
                <option value="Leave">Leave</option>
                <option value="Absent">Absent</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
          </div>

          {!['Absent', 'Leave', 'Holiday'].includes(markData.status) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Check-In Time</label>
                <input
                  type="time"
                  value={markData.checkIn}
                  onChange={(e) => {
                    const t = e.target.value;
                    setMarkData(prev => {
                      let mins = prev.workingMinutes;
                      if (t && prev.checkOut) {
                        const [sh, sm] = t.split(':').map(Number);
                        const [eh, em] = prev.checkOut.split(':').map(Number);
                        const diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff > 0) mins = diff;
                      }
                      return { ...prev, checkIn: t, workingMinutes: mins };
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Check-Out Time</label>
                <input
                  type="time"
                  value={markData.checkOut}
                  onChange={(e) => {
                    const t = e.target.value;
                    setMarkData(prev => {
                      let mins = prev.workingMinutes;
                      if (prev.checkIn && t) {
                        const [sh, sm] = prev.checkIn.split(':').map(Number);
                        const [eh, em] = t.split(':').map(Number);
                        const diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff > 0) mins = diff;
                      }
                      return { ...prev, checkOut: t, workingMinutes: mins };
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note (Optional)</label>
            <textarea
              rows={2}
              value={markData.remarks}
              onChange={(e) => setMarkData({ ...markData, remarks: e.target.value })}
              placeholder="e.g. Manually marked by Administrator"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
