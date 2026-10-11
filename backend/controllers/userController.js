import bcrypt from 'bcryptjs';
import { list, findById, findOne, create, update, remove } from '../repositories/store.js';
import { getTodayDateString, formatMinutes } from '../utils/calculations.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getEmployees(req, res, next) {
  try {
    const { search, department, status, role } = req.query;
    let allUsers = await list('users', {}, { createdAt: -1 });

    const today = getTodayDateString();
    const allTodayAttendance = await list('attendance', { date: today });
    const allTasks = await list('tasks', {});

    // Filter
    let filtered = allUsers.filter(u => {
      // Exclude passwords
      delete u.password;

      if (role && u.role !== role) return false;
      if (department && department !== 'All' && u.department !== department) return false;
      if (status) {
        if (status === 'active' && !u.isActive) return false;
        if (status === 'inactive' && u.isActive) return false;
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(term);
        const matchesEmail = u.email?.toLowerCase().includes(term);
        const matchesEmpId = u.employeeId?.toLowerCase().includes(term);
        const matchesDept = u.department?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesEmpId && !matchesDept) return false;
      }

      return true;
    });

    // Augment with today's attendance and active task count
    const enriched = filtered.map(u => {
      const att = allTodayAttendance.find(a => String(a.employee?._id || a.employee) === String(u._id));
      const userTasks = allTasks.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(u._id));
      const completedTasks = userTasks.filter(t => t.status === 'Completed').length;

      return {
        ...u,
        todayAttendance: att ? att.status : 'Absent',
        checkInTime: att ? att.checkIn : null,
        checkOutTime: att ? att.checkOut : null,
        workingHoursFormatted: att ? formatMinutes(att.workingMinutes) : '0h 00m',
        workingMinutes: att ? att.workingMinutes : 0,
        totalTasks: userTasks.length,
        completedTasks,
        pendingTasks: userTasks.length - completedTasks
      };
    });

    return res.json({
      success: true,
      count: enriched.length,
      employees: enriched
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;

    // Security: Employee can only view their own profile, unless caller is ADMIN
    if (req.user.role !== 'ADMIN' && String(req.user._id) !== String(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const employee = await findById('users', id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    delete employee.password;

    // Gather history
    const today = getTodayDateString();
    const attendanceHistory = await list('attendance', { employee: id }, { date: -1 });
    const tasks = await list('tasks', { assignedTo: id }, { deadline: 1 });
    const leaveHistory = await list('leaves', { employee: id }, { createdAt: -1 });
    const workReports = await list('workReports', { employee: id }, { date: -1 });

    const todayAttendance = attendanceHistory.find(a => a.date === today) || null;
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const pendingTasks = tasks.filter(t => t.status !== 'Completed');

    // Calculate total minutes worked across records
    const totalWorkingMinutes = attendanceHistory.reduce((sum, item) => sum + (item.workingMinutes || 0), 0);

    return res.json({
      success: true,
      employee: {
        ...employee,
        todayAttendance,
        workingHoursFormatted: todayAttendance ? formatMinutes(todayAttendance.workingMinutes) : '0h 00m',
        totalWorkingMinutes,
        totalWorkingHoursFormatted: formatMinutes(totalWorkingMinutes),
        tasksCount: tasks.length,
        completedTasksCount: completedTasks.length,
        pendingTasksCount: pendingTasks.length
      },
      attendanceHistory: attendanceHistory.slice(0, 30),
      tasks,
      leaveHistory,
      workReports: workReports.slice(0, 30)
    });
  } catch (err) {
    next(err);
  }
}

export async function createEmployee(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      employeeId,
      department,
      designation,
      joiningDate,
      password,
      role = 'EMPLOYEE'
    } = req.body;

    if (!name || !email || !employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, Employee ID, and Password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanEmpId = employeeId.trim().toUpperCase();

    const existingEmail = await findOne('users', { email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email already exists.'
      });
    }

    const existingEmpId = await findOne('users', { employeeId: cleanEmpId });
    if (existingEmpId) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this Employee ID already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await create('users', {
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      employeeId: cleanEmpId,
      department: (department || 'Engineering').trim(),
      designation: (designation || 'Software Engineer').trim(),
      joiningDate: joiningDate || getTodayDateString(),
      password: hashedPassword,
      role,
      isActive: true,
      workStatus: 'Offline',
      lastSeen: new Date().toISOString()
    });

    await logAudit(req.user, 'EMPLOYEE_CREATED', 'User', newEmployee._id, {
      name: newEmployee.name,
      employeeId: newEmployee.employeeId,
      email: newEmployee.email,
      department: newEmployee.department
    });

    const safeEmployee = { ...newEmployee };
    delete safeEmployee.password;

    return res.status(201).json({
      success: true,
      message: 'Employee successfully created.',
      employee: safeEmployee
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, employeeId, department, designation, joiningDate, role } = req.body;

    const existing = await findById('users', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existing.email) {
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }
        const duplicateEmail = await findOne('users', { email: cleanEmail });
        if (duplicateEmail && String(duplicateEmail._id) !== String(id)) {
          return res.status(409).json({
            success: false,
            message: 'An employee with this email address already exists.'
          });
        }
        updateData.email = cleanEmail;
      }
    }

    if (employeeId) {
      const cleanEmpId = employeeId.trim().toUpperCase();
      if (cleanEmpId !== existing.employeeId) {
        const duplicateId = await findOne('users', { employeeId: cleanEmpId });
        if (duplicateId && String(duplicateId._id) !== String(id)) {
          return res.status(409).json({
            success: false,
            message: 'An employee with this Employee ID already exists.'
          });
        }
        updateData.employeeId = cleanEmpId;
      }
    }

    if (phone !== undefined) updateData.phone = phone.trim();
    if (department) updateData.department = department.trim();
    if (designation) updateData.designation = designation.trim();
    if (joiningDate) updateData.joiningDate = joiningDate;
    if (role && ['ADMIN', 'EMPLOYEE', 'MANAGER'].includes(role)) {
      updateData.role = role;
    }

    const updated = await update('users', id, updateData);

    await logAudit(req.user, 'EMPLOYEE_UPDATED', 'User', id, updateData);

    const safeEmployee = { ...updated };
    delete safeEmployee.password;

    return res.json({
      success: true,
      message: 'Employee updated successfully.',
      employee: safeEmployee
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive status is required.' });
    }

    // Safety: prevent admin from disabling own account
    if (String(req.user._id) === String(id) && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot disable your own active administrator account.'
      });
    }

    const updated = await update('users', id, { isActive: Boolean(isActive) });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await logAudit(req.user, isActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DISABLED', 'User', id, {
      isActive: Boolean(isActive)
    });

    return res.json({
      success: true,
      message: `Employee account ${isActive ? 'activated' : 'disabled'} successfully.`,
      employee: { _id: updated._id, isActive: updated.isActive }
    });
  } catch (err) {
    next(err);
  }
}

export async function resetEmployeePassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await update('users', id, { password: hashedPassword });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await logAudit(req.user, 'PASSWORD_RESET_BY_ADMIN', 'User', id, {});

    return res.json({
      success: true,
      message: 'Employee password reset successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot delete your own active administrator account.'
      });
    }

    const existing = await findById('users', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await remove('users', id);
    await logAudit(req.user, 'EMPLOYEE_DELETED', 'User', id, { name: existing.name, employeeId: existing.employeeId });

    return res.json({
      success: true,
      message: `Employee ${existing.name} (${existing.employeeId}) deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}
