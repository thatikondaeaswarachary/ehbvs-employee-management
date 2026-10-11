import { list, count } from '../repositories/store.js';
import { getTodayDateString, formatMinutes } from '../utils/calculations.js';

export async function getDashboardMetrics(req, res, next) {
  try {
    const today = getTodayDateString();

    const allUsers = await list('users', {});
    const employees = allUsers.filter(u => u.role !== 'ADMIN');
    const totalEmployees = employees.length;

    const todayAttendance = await list('attendance', { date: today });
    const allTasks = await list('tasks', {});
    const allLeaves = await list('leaves', {});

    // Metrics
    const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
    const onLeaveToday = todayAttendance.filter(a => a.status === 'Leave').length;
    const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

    const currentlyWorking = employees.filter(u => u.workStatus === 'Working' && u.isActive).length;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = totalTasks - completedTasks;

    // Real Employee Activity list
    const employeeActivity = employees.map(emp => {
      const att = todayAttendance.find(a => String(a.employee?._id || a.employee) === String(emp._id));
      const empTasks = allTasks.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(emp._id));
      const empCompleted = empTasks.filter(t => t.status === 'Completed').length;

      return {
        _id: emp._id,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        status: emp.workStatus || (att ? 'Working' : 'Offline'),
        hours: att ? formatMinutes(att.workingMinutes) : '0h 00m',
        workingMinutes: att ? att.workingMinutes : 0,
        tasksFormatted: `${empCompleted}/${empTasks.length}`,
        lastSeen: emp.lastSeen,
        isActive: emp.isActive
      };
    });

    // Generate Attendance Trend (Past 7 days)
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getTodayDateString(d);
      const dayAtt = await list('attendance', { date: dateStr });
      const dayPresent = dayAtt.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      const dayLeave = dayAtt.filter(a => a.status === 'Leave').length;
      const dayAbsent = Math.max(0, totalEmployees - dayPresent - dayLeave);

      const dayMinutes = dayAtt.reduce((sum, a) => sum + (a.workingMinutes || 0), 0);
      const avgHours = dayPresent > 0 ? Number((dayMinutes / dayPresent / 60).toFixed(1)) : 0;

      attendanceTrend.push({
        date: dateStr.slice(5), // MM-DD
        fullDate: dateStr,
        present: dayPresent,
        absent: dayAbsent,
        leave: dayLeave,
        avgHours
      });
    }

    // Task completion breakdown
    const taskBreakdown = [
      { name: 'Not Started', count: allTasks.filter(t => t.status === 'Not Started').length },
      { name: 'In Progress', count: allTasks.filter(t => t.status === 'In Progress').length },
      { name: 'On Hold', count: allTasks.filter(t => t.status === 'On Hold').length },
      { name: 'Completed', count: completedTasks }
    ];

    // Department distribution
    const deptMap = {};
    for (const emp of employees) {
      const dept = emp.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }
    const departmentDistribution = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Leave breakdown
    const leaveBreakdown = [
      { name: 'Casual Leave', value: allLeaves.filter(l => l.leaveType === 'Casual Leave').length },
      { name: 'Sick Leave', value: allLeaves.filter(l => l.leaveType === 'Sick Leave').length },
      { name: 'Personal Leave', value: allLeaves.filter(l => l.leaveType === 'Personal Leave').length },
      { name: 'Other', value: allLeaves.filter(l => l.leaveType === 'Other').length }
    ];

    return res.json({
      success: true,
      metrics: {
        totalEmployees,
        presentToday,
        absentToday,
        onLeaveToday,
        currentlyWorking,
        totalTasks,
        pendingTasks,
        completedTasks
      },
      employeeActivity,
      attendanceTrend,
      taskBreakdown,
      departmentDistribution,
      leaveBreakdown
    });
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceReport(req, res, next) {
  try {
    const { startDate, endDate, department, employeeId, status } = req.query;

    let query = {};
    if (employeeId && employeeId !== 'All') query.employee = employeeId;
    if (status && status !== 'All') query.status = status;

    let records = await list('attendance', query, { date: -1 });

    if (startDate && endDate) {
      records = records.filter(r => r.date >= startDate && r.date <= endDate);
    }

    if (department && department !== 'All') {
      records = records.filter(r => r.employee?.department === department);
    }

    const data = records.map(r => ({
      date: r.date,
      employeeId: r.employee?.employeeId || 'N/A',
      employeeName: r.employee?.name || 'Unknown',
      department: r.employee?.department || 'N/A',
      checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '--',
      checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '--',
      workingHours: formatMinutes(r.workingMinutes),
      workingMinutes: r.workingMinutes || 0,
      status: r.status,
      remarks: r.remarks || ''
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function getWorkHoursReport(req, res, next) {
  try {
    const { startDate, endDate, department } = req.query;

    let users = await list('users', { role: { $ne: 'ADMIN' } });
    if (department && department !== 'All') {
      users = users.filter(u => u.department === department);
    }

    let allAttendance = await list('attendance', {});
    if (startDate && endDate) {
      allAttendance = allAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    }

    const report = users.map(user => {
      const userAtt = allAttendance.filter(a => String(a.employee?._id || a.employee) === String(user._id));
      const totalMinutes = userAtt.reduce((sum, a) => sum + (a.workingMinutes || 0), 0);
      const daysWorked = userAtt.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      const avgMinutes = daysWorked > 0 ? Math.round(totalMinutes / daysWorked) : 0;

      return {
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        designation: user.designation,
        daysWorked,
        totalWorkingMinutes: totalMinutes,
        totalWorkingHoursFormatted: formatMinutes(totalMinutes),
        averageDailyHoursFormatted: formatMinutes(avgMinutes)
      };
    });

    return res.json({ success: true, count: report.length, data: report });
  } catch (err) {
    next(err);
  }
}

export async function getTaskReport(req, res, next) {
  try {
    const { status, priority, department } = req.query;

    let query = {};
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;

    let tasks = await list('tasks', query, { createdAt: -1 });

    if (department && department !== 'All') {
      tasks = tasks.filter(t => t.department === department || t.assignedTo?.department === department);
    }

    const data = tasks.map(t => ({
      taskId: t.taskId,
      title: t.title,
      assignedEmployee: t.assignedTo?.name || 'Unassigned',
      employeeId: t.assignedTo?.employeeId || 'N/A',
      department: t.department || t.assignedTo?.department || 'N/A',
      priority: t.priority,
      status: t.status,
      progress: `${t.progress}%`,
      startDate: t.startDate || 'N/A',
      deadline: t.deadline,
      completedAt: t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : 'N/A'
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function getLeaveReport(req, res, next) {
  try {
    const { status, leaveType } = req.query;

    let query = {};
    if (status && status !== 'All') query.status = status;
    if (leaveType && leaveType !== 'All') query.leaveType = leaveType;

    let leaves = await list('leaves', query, { createdAt: -1 });

    const data = leaves.map(l => ({
      leaveId: l._id,
      employeeName: l.employee?.name || 'N/A',
      employeeId: l.employee?.employeeId || 'N/A',
      department: l.employee?.department || 'N/A',
      leaveType: l.leaveType,
      fromDate: l.fromDate,
      toDate: l.toDate,
      reason: l.reason,
      status: l.status,
      adminRemarks: l.adminRemarks || 'N/A',
      appliedAt: new Date(l.createdAt).toLocaleDateString()
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeSummaryReport(req, res, next) {
  try {
    const users = await list('users', { role: { $ne: 'ADMIN' } });
    const allTasks = await list('tasks', {});
    const allAttendance = await list('attendance', {});
    const allReports = await list('workReports', {});

    const summary = users.map(user => {
      const empTasks = allTasks.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(user._id));
      const completedTasks = empTasks.filter(t => t.status === 'Completed');
      const onTimeTasks = completedTasks.filter(t => !t.completedAt || !t.deadline || t.completedAt.split('T')[0] <= t.deadline);
      const pendingTasks = empTasks.filter(t => t.status !== 'Completed');

      const empAttendance = allAttendance.filter(a => String(a.employee?._id || a.employee) === String(user._id));
      const presentCount = empAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      const leaveCount = empAttendance.filter(a => a.status === 'Leave').length;

      const reportsSubmitted = allReports.filter(r => String(r.employee?._id || r.employee) === String(user._id)).length;

      return {
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        designation: user.designation,
        tasksTotal: empTasks.length,
        tasksCompleted: completedTasks.length,
        tasksOnTime: onTimeTasks.length,
        tasksPending: pendingTasks.length,
        reportsSubmitted,
        attendancePresentDays: presentCount,
        attendanceLeaveDays: leaveCount,
        status: user.isActive ? 'Active' : 'Disabled'
      };
    });

    return res.json({ success: true, count: summary.length, data: summary });
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const { type } = req.params;
    let filename = `EHBVS_${type}_Report_${getTodayDateString()}.csv`;
    let rows = [];
    let headers = [];

    if (type === 'attendance') {
      const records = await list('attendance', {}, { date: -1 });
      headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Remarks'];
      rows = records.map(r => [
        r.date,
        r.employee?.employeeId || '',
        `"${r.employee?.name || ''}"`,
        `"${r.employee?.department || ''}"`,
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '',
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '',
        formatMinutes(r.workingMinutes),
        r.status,
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ]);
    } else if (type === 'tasks') {
      const tasks = await list('tasks', {}, { createdAt: -1 });
      headers = ['Task ID', 'Title', 'Assigned To', 'Department', 'Priority', 'Status', 'Progress', 'Start Date', 'Deadline', 'Completed Date'];
      rows = tasks.map(t => [
        t.taskId,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.assignedTo?.name || ''}"`,
        `"${t.department || ''}"`,
        t.priority,
        t.status,
        `${t.progress}%`,
        t.startDate || '',
        t.deadline || '',
        t.completedAt ? t.completedAt.split('T')[0] : ''
      ]);
    } else if (type === 'leaves') {
      const leaves = await list('leaves', {}, { createdAt: -1 });
      headers = ['Employee ID', 'Employee Name', 'Department', 'Leave Type', 'From Date', 'To Date', 'Reason', 'Status', 'Admin Remarks'];
      rows = leaves.map(l => [
        l.employee?.employeeId || '',
        `"${l.employee?.name || ''}"`,
        `"${l.employee?.department || ''}"`,
        l.leaveType,
        l.fromDate,
        l.toDate,
        `"${(l.reason || '').replace(/"/g, '""')}"`,
        l.status,
        `"${(l.adminRemarks || '').replace(/"/g, '""')}"`
      ]);
    } else if (type === 'employees') {
      const users = await list('users', { role: { $ne: 'ADMIN' } });
      headers = ['Employee ID', 'Full Name', 'Email', 'Phone', 'Department', 'Designation', 'Joining Date', 'Status', 'Work Status'];
      rows = users.map(u => [
        u.employeeId,
        `"${u.name}"`,
        u.email,
        u.phone || '',
        `"${u.department}"`,
        `"${u.designation}"`,
        u.joiningDate ? String(u.joiningDate).split('T')[0] : '',
        u.isActive ? 'Active' : 'Disabled',
        u.workStatus || 'Offline'
      ]);
    } else if (type === 'work-reports') {
      const reports = await list('workReports', {}, { date: -1 });
      headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Work Completed', 'Blockers', 'Tomorrow Plan', 'Remarks'];
      rows = reports.map(r => [
        r.date,
        r.employee?.employeeId || '',
        `"${r.employee?.name || ''}"`,
        `"${r.employee?.department || ''}"`,
        `"${(r.completedWork || '').replace(/"/g, '""')}"`,
        `"${(r.blockers || '').replace(/"/g, '""')}"`,
        `"${(r.tomorrowPlan || '').replace(/"/g, '""')}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ]);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type requested.' });
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
