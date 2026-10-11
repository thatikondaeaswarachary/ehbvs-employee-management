import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendanceService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import MetricCard from '../../components/MetricCard';
import ErrorState from '../../components/ErrorState';
import {
  CalendarCheck,
  Clock,
  UserCheck,
  CalendarDays,
  Calendar,
  Filter
} from 'lucide-react';

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [monthFilter, setMonthFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (monthFilter) {
        params.month = monthFilter;
      }

      const res = await attendanceService.getMyAttendance(params);
      if (res.success) {
        setRecords(res.records || []);
        setSummary(res.summary);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [monthFilter, startDate, endDate]);

  const setPresetMonth = (offset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setStartDate('');
    setEndDate('');
    setMonthFilter(m);
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="font-mono font-semibold text-slate-900">{row.date}</span>
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
      header: 'Working Hours',
      accessor: 'workingHoursFormatted',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {row.workingHoursFormatted || '0h 00m'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Notes / Remarks',
      accessor: 'remarks',
      render: (row) => <span className="text-xs text-slate-500 italic">{row.remarks || '—'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Attendance Record
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personal historical punch logs, verified working hours, and monthly summaries.
          </p>
        </div>
      </div>

      {/* Summary Cards (Section 16) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Days Present"
          value={summary?.present ?? 0}
          icon={UserCheck}
          color="emerald"
          subtitle="Full day attendances"
        />
        <MetricCard
          title="Half Days"
          value={summary?.halfDay ?? 0}
          icon={Clock}
          color="amber"
          subtitle="Partial shifts (< 4h)"
        />
        <MetricCard
          title="Leave Days"
          value={summary?.leave ?? 0}
          icon={CalendarDays}
          color="purple"
          subtitle="Approved PTO"
        />
        <MetricCard
          title="Total Hours"
          value={summary?.totalHoursFormatted ?? '0h 00m'}
          icon={CalendarCheck}
          color="blue"
          subtitle="Rendered in period"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPresetMonth(0)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              monthFilter && !startDate ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPresetMonth(-1)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            Previous Month
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setMonthFilter('');
              }}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setMonthFilter('');
              }}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchAttendance} />
      ) : (
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          searchPlaceholder="Search by date or status..."
        />
      )}
    </div>
  );
}
