import { list, findById, create, update } from '../repositories/store.js';
import { getTodayDateString } from '../utils/calculations.js';
import { logAudit } from '../utils/auditLogger.js';

export async function submitWorkReport(req, res, next) {
  try {
    const employeeId = req.user._id;
    const {
      date = getTodayDateString(),
      completedWork,
      tasksWorkedOn = [],
      blockers = '',
      tomorrowPlan = '',
      remarks = ''
    } = req.body;

    if (!completedWork || completedWork.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide details of work completed today.'
      });
    }

    const report = await create('workReports', {
      employee: employeeId,
      date,
      completedWork: completedWork.trim(),
      tasksWorkedOn: Array.isArray(tasksWorkedOn) ? tasksWorkedOn : [tasksWorkedOn].filter(Boolean),
      blockers: blockers.trim(),
      tomorrowPlan: tomorrowPlan.trim(),
      remarks: remarks.trim()
    });

    await logAudit(req.user, 'WORK_REPORT_SUBMITTED', 'WorkReport', report._id, {
      date,
      employeeName: req.user.name
    });

    return res.status(201).json({
      success: true,
      message: 'Daily work report submitted successfully.',
      report
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyWorkReports(req, res, next) {
  try {
    const employeeId = req.user._id;
    const { startDate, endDate, date } = req.query;

    let query = { employee: employeeId };
    if (date) query.date = date;

    let reports = await list('workReports', query, { date: -1 });

    if (startDate && endDate) {
      reports = reports.filter(r => r.date >= startDate && r.date <= endDate);
    }

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllWorkReports(req, res, next) {
  try {
    const { employeeId, department, date, startDate, endDate } = req.query;

    let query = {};
    if (employeeId && employeeId !== 'All') query.employee = employeeId;
    if (date) query.date = date;

    let reports = await list('workReports', query, { date: -1 });

    if (department && department !== 'All') {
      reports = reports.filter(r => r.employee?.department === department);
    }

    if (startDate && endDate) {
      reports = reports.filter(r => r.date >= startDate && r.date <= endDate);
    }

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkReportById(req, res, next) {
  try {
    const { id } = req.params;
    const report = await findById('workReports', id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Work report not found.' });
    }

    const reportEmpId = report.employee?._id || report.employee;
    if (req.user.role !== 'ADMIN' && String(reportEmpId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({
      success: true,
      report
    });
  } catch (err) {
    next(err);
  }
}
