import { list, findById, findOne, create, update } from '../repositories/store.js';
import { logAudit } from '../utils/auditLogger.js';

export async function applyLeave(req, res, next) {
  try {
    const employeeId = req.user._id;
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave Type, From Date, To Date, and Reason are required.'
      });
    }

    if (toDate < fromDate) {
      return res.status(400).json({
        success: false,
        message: 'To Date cannot be earlier than From Date.'
      });
    }

    const leave = await create('leaves', {
      employee: employeeId,
      leaveType,
      fromDate,
      toDate,
      reason: reason.trim(),
      status: 'Pending',
      adminRemarks: '',
      reviewedBy: null,
      reviewedAt: null
    });

    await logAudit(req.user, 'LEAVE_REQUESTED', 'Leave', leave._id, {
      leaveType,
      fromDate,
      toDate,
      employeeName: req.user.name
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for review.',
      leave
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyLeaves(req, res, next) {
  try {
    const employeeId = req.user._id;
    const leaves = await list('leaves', { employee: employeeId }, { createdAt: -1 });

    // Calculate balances (standard enterprise policy: 12 Casual, 10 Sick, 6 Personal per year)
    const approved = leaves.filter(l => l.status === 'Approved');
    const casualUsed = approved.filter(l => l.leaveType === 'Casual Leave').length;
    const sickUsed = approved.filter(l => l.leaveType === 'Sick Leave').length;
    const personalUsed = approved.filter(l => l.leaveType === 'Personal Leave').length;

    const balances = {
      casual: { total: 12, used: casualUsed, remaining: Math.max(0, 12 - casualUsed) },
      sick: { total: 10, used: sickUsed, remaining: Math.max(0, 10 - sickUsed) },
      personal: { total: 6, used: personalUsed, remaining: Math.max(0, 6 - personalUsed) }
    };

    return res.json({
      success: true,
      count: leaves.length,
      leaves,
      balances
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllLeaves(req, res, next) {
  try {
    const { status, employeeId, department } = req.query;

    let query = {};
    if (status && status !== 'All') query.status = status;
    if (employeeId && employeeId !== 'All') query.employee = employeeId;

    let leaves = await list('leaves', query, { createdAt: -1 });

    if (department && department !== 'All') {
      leaves = leaves.filter(l => l.employee?.department === department);
    }

    return res.json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (err) {
    next(err);
  }
}

export async function approveLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const leave = await findById('leaves', id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const updated = await update('leaves', id, {
      status: 'Approved',
      adminRemarks: adminRemarks || 'Approved by Administration',
      reviewedBy: req.user._id,
      reviewedAt: new Date().toISOString()
    });

    // Business Rule 15: When leave is approved, attendance should reflect the approved leave dates.
    const empId = leave.employee?._id || leave.employee;
    let curr = new Date(leave.fromDate);
    const end = new Date(leave.toDate);

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const existingAttendance = await findOne('attendance', { employee: empId, date: dateStr });
      if (!existingAttendance) {
        await create('attendance', {
          employee: empId,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          workingMinutes: 0,
          status: 'Leave',
          workStatus: 'Offline',
          remarks: `Approved ${leave.leaveType}`
        });
      } else {
        await update('attendance', existingAttendance._id, {
          status: 'Leave',
          remarks: `Approved ${leave.leaveType}`
        });
      }
      curr.setDate(curr.getDate() + 1);
    }

    // Send notification to employee
    await create('notifications', {
      user: empId,
      title: 'Leave Request Approved',
      message: `Your ${leave.leaveType} from ${leave.fromDate} to ${leave.toDate} has been approved.`,
      type: 'leave',
      link: '/employee/leave'
    });

    await logAudit(req.user, 'LEAVE_APPROVED', 'Leave', id, {
      leaveType: leave.leaveType,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      employeeId: empId
    });

    return res.json({
      success: true,
      message: 'Leave request approved and attendance records updated.',
      leave: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const leave = await findById('leaves', id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const updated = await update('leaves', id, {
      status: 'Rejected',
      adminRemarks: adminRemarks || 'Declined per operational requirements',
      reviewedBy: req.user._id,
      reviewedAt: new Date().toISOString()
    });

    const empId = leave.employee?._id || leave.employee;
    await create('notifications', {
      user: empId,
      title: 'Leave Request Rejected',
      message: `Your ${leave.leaveType} from ${leave.fromDate} to ${leave.toDate} was declined: "${adminRemarks || 'Operational requirements'}"`,
      type: 'leave',
      link: '/employee/leave'
    });

    await logAudit(req.user, 'LEAVE_REJECTED', 'Leave', id, {
      leaveType: leave.leaveType,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      employeeId: empId,
      reason: adminRemarks
    });

    return res.json({
      success: true,
      message: 'Leave request rejected.',
      leave: updated
    });
  } catch (err) {
    next(err);
  }
}
