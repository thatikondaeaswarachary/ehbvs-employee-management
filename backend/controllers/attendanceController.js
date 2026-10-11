import { list, findOne, findById, create, update } from '../repositories/store.js';
import { getTodayDateString, calculateWorkingMinutes, formatMinutes, formatTime } from '../utils/calculations.js';
import { logAudit } from '../utils/auditLogger.js';

export async function checkIn(req, res, next) {
  try {
    const employeeId = req.user._id;
    const today = getTodayDateString();

    // Enforce business rule: check if already checked in today
    const existing = await findOne('attendance', { employee: employeeId, date: today });
    if (existing && existing.checkIn) {
      return res.status(400).json({
        success: false,
        message: `You have already checked in today at ${formatTime(existing.checkIn)}. Multiple check-ins per day are not permitted.`,
        attendance: existing
      });
    }

    const now = new Date();

    let record;
    if (existing) {
      record = await update('attendance', existing._id, {
        checkIn: now.toISOString(),
        status: 'Present',
        workStatus: 'Working'
      });
    } else {
      record = await create('attendance', {
        employee: employeeId,
        date: today,
        checkIn: now.toISOString(),
        checkOut: null,
        workingMinutes: 0,
        status: 'Present',
        workStatus: 'Working',
        remarks: ''
      });
    }

    // Update user current status
    await update('users', employeeId, {
      workStatus: 'Working',
      lastSeen: now.toISOString()
    });

    return res.status(200).json({
      success: true,
      message: `Check-in successful at ${formatTime(now)}. Have a productive day!`,
      attendance: {
        ...record,
        workingHoursFormatted: '0h 00m'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function checkOut(req, res, next) {
  try {
    const employeeId = req.user._id;
    const today = getTodayDateString();

    const existing = await findOne('attendance', { employee: employeeId, date: today });
    if (!existing || !existing.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out: You have not checked in for today yet.'
      });
    }

    if (existing.checkOut) {
      return res.status(400).json({
        success: false,
        message: `You have already checked out today at ${formatTime(existing.checkOut)}.`,
        attendance: existing
      });
    }

    const now = new Date();
    const workedMinutes = calculateWorkingMinutes(existing.checkIn, now);

    // Determine status (Half Day if < 4 hours / 240 mins)
    let finalStatus = existing.status;
    if (workedMinutes < 240 && finalStatus !== 'Leave') {
      finalStatus = 'Half Day';
    }

    const updated = await update('attendance', existing._id, {
      checkOut: now.toISOString(),
      workingMinutes: workedMinutes,
      status: finalStatus,
      workStatus: 'Completed'
    });

    // Update user status
    await update('users', employeeId, {
      workStatus: 'Completed',
      lastSeen: now.toISOString()
    });

    return res.json({
      success: true,
      message: `Check-out successful at ${formatTime(now)}. Total time: ${formatMinutes(workedMinutes)}.`,
      attendance: {
        ...updated,
        workingHoursFormatted: formatMinutes(workedMinutes)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['Working', 'Break', 'Completed', 'Offline'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const employeeId = req.user._id;
    const now = new Date();

    await update('users', employeeId, {
      workStatus: status,
      lastSeen: now.toISOString()
    });

    const today = getTodayDateString();
    const existing = await findOne('attendance', { employee: employeeId, date: today });
    if (existing) {
      await update('attendance', existing._id, { workStatus: status });
    }

    return res.json({
      success: true,
      message: `Work status set to "${status}".`,
      workStatus: status
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyAttendance(req, res, next) {
  try {
    const employeeId = req.user._id;
    const { month, startDate, endDate } = req.query;

    let records = await list('attendance', { employee: employeeId }, { date: -1 });

    if (month) {
      records = records.filter(r => r.date && r.date.startsWith(month));
    } else if (startDate && endDate) {
      records = records.filter(r => r.date && r.date >= startDate && r.date <= endDate);
    }

    // Summary calculations
    let presentCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let totalMinutes = 0;

    const enriched = records.map(r => {
      if (r.status === 'Present') presentCount++;
      if (r.status === 'Half Day') halfDayCount++;
      if (r.status === 'Leave') leaveCount++;
      totalMinutes += r.workingMinutes || 0;

      return {
        ...r,
        workingHoursFormatted: formatMinutes(r.workingMinutes)
      };
    });

    return res.json({
      success: true,
      records: enriched,
      summary: {
        totalDays: records.length,
        present: presentCount,
        halfDay: halfDayCount,
        leave: leaveCount,
        totalMinutes,
        totalHoursFormatted: formatMinutes(totalMinutes)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllAttendance(req, res, next) {
  try {
    const { date, employeeId, department, month, status } = req.query;

    let query = {};
    if (date) query.date = date;
    if (employeeId) query.employee = employeeId;
    if (status && status !== 'All') query.status = status;

    let records = await list('attendance', query, { date: -1 });

    if (month) {
      records = records.filter(r => r.date && r.date.startsWith(month));
    }

    if (department && department !== 'All') {
      records = records.filter(r => r.employee?.department === department);
    }

    const enriched = records.map(r => ({
      ...r,
      workingHoursFormatted: formatMinutes(r.workingMinutes)
    }));

    return res.json({
      success: true,
      count: enriched.length,
      records: enriched
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeAttendance(req, res, next) {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;

    let records = await list('attendance', { employee: employeeId }, { date: -1 });
    if (month) {
      records = records.filter(r => r.date && r.date.startsWith(month));
    }

    const enriched = records.map(r => ({
      ...r,
      workingHoursFormatted: formatMinutes(r.workingMinutes)
    }));

    return res.json({
      success: true,
      count: enriched.length,
      records: enriched
    });
  } catch (err) {
    next(err);
  }
}

function parseTimeToIso(timeOrIso, dateStr) {
  if (!timeOrIso) return null;
  const str = String(timeOrIso).trim();
  if (str.includes('T') || str.includes('Z')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [hh, mm] = str.split(':');
    const d = new Date(`${dateStr}T${hh.padStart(2, '0')}:${mm}:00`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function adminMarkAttendance(req, res, next) {
  try {
    const { employeeId, date, checkIn, checkOut, status = 'Present', remarks = '', workingMinutes } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Please select an employee.' });
    }

    const attendanceDate = date || getTodayDateString();
    const isoCheckIn = parseTimeToIso(checkIn, attendanceDate);
    const isoCheckOut = parseTimeToIso(checkOut, attendanceDate);

    let minutes = 0;
    if (workingMinutes !== undefined && workingMinutes !== '') {
      minutes = Number(workingMinutes);
    } else if (isoCheckIn && isoCheckOut) {
      minutes = calculateWorkingMinutes(isoCheckIn, isoCheckOut);
    } else if (status === 'Present') {
      minutes = 480;
    } else if (status === 'Half Day') {
      minutes = 240;
    }

    const existing = await findOne('attendance', { employee: employeeId, date: attendanceDate });
    let record;
    if (existing) {
      record = await update('attendance', existing._id, {
        checkIn: isoCheckIn !== undefined ? isoCheckIn : existing.checkIn,
        checkOut: isoCheckOut !== undefined ? isoCheckOut : existing.checkOut,
        status,
        workingMinutes: isNaN(minutes) ? 0 : minutes,
        remarks: remarks || existing.remarks,
        updatedBy: req.user._id
      });
    } else {
      record = await create('attendance', {
        employee: employeeId,
        date: attendanceDate,
        checkIn: isoCheckIn,
        checkOut: isoCheckOut,
        status,
        workStatus: status === 'Present' ? 'Working' : (status === 'Half Day' ? 'Completed' : 'Offline'),
        workingMinutes: isNaN(minutes) ? 0 : minutes,
        remarks,
        updatedBy: req.user._id
      });
    }

    await logAudit(req.user, existing ? 'ATTENDANCE_MODIFIED' : 'ATTENDANCE_ADMIN_CREATED', 'Attendance', record._id, {
      employeeId,
      date: attendanceDate,
      status,
      remarks
    });

    return res.status(200).json({
      success: true,
      message: `Attendance for ${attendanceDate} successfully saved as ${status}.`,
      attendance: {
        ...record,
        workingHoursFormatted: formatMinutes(record.workingMinutes)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAttendanceRecord(req, res, next) {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, status, remarks, workingMinutes, date } = req.body;

    const existing = await findById('attendance', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const recordDate = date || existing.date || getTodayDateString();
    const isoCheckIn = checkIn !== undefined ? (checkIn ? parseTimeToIso(checkIn, recordDate) : null) : existing.checkIn;
    const isoCheckOut = checkOut !== undefined ? (checkOut ? parseTimeToIso(checkOut, recordDate) : null) : existing.checkOut;

    let calculatedMinutes = existing.workingMinutes;
    if (workingMinutes !== undefined && workingMinutes !== '') {
      calculatedMinutes = Number(workingMinutes);
    } else if (isoCheckIn && isoCheckOut) {
      calculatedMinutes = calculateWorkingMinutes(isoCheckIn, isoCheckOut);
    } else if (status === 'Absent' || status === 'Leave' || status === 'Holiday') {
      calculatedMinutes = 0;
    }

    const updateData = {
      updatedBy: req.user._id,
      workingMinutes: isNaN(calculatedMinutes) ? 0 : calculatedMinutes
    };

    if (date) updateData.date = date;
    if (checkIn !== undefined) updateData.checkIn = isoCheckIn;
    if (checkOut !== undefined) updateData.checkOut = isoCheckOut;
    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;

    const updated = await update('attendance', id, updateData);

    await logAudit(req.user, 'ATTENDANCE_MODIFIED', 'Attendance', id, {
      employeeId: existing.employee?._id || existing.employee,
      date: recordDate,
      oldStatus: existing.status,
      newStatus: status || existing.status,
      remarks
    });

    return res.json({
      success: true,
      message: 'Attendance record updated successfully with audit trail.',
      attendance: {
        ...updated,
        workingHoursFormatted: formatMinutes(updated.workingMinutes)
      }
    });
  } catch (err) {
    next(err);
  }
}
