import bcrypt from 'bcryptjs';
import { findOne, findById, create, update } from '../repositories/store.js';
import { signToken } from '../utils/jwt.js';
import { getTodayDateString } from '../utils/calculations.js';
import { logAudit } from '../utils/auditLogger.js';

export async function login(req, res, next) {
  try {
    const { identifier, email, employeeId, password } = req.body;
    const loginKey = (identifier || email || employeeId || '').trim();

    if (!loginKey || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Email or Employee ID, and Password.'
      });
    }

    // Lookup user by either email or employeeId
    let user = null;
    if (loginKey.includes('@')) {
      user = await findOne('users', { email: loginKey.toLowerCase() });
    } else {
      user = await findOne('users', { employeeId: loginKey.toUpperCase() });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your Email/Employee ID and Password.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your company administrator.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password did not match.'
      });
    }

    // Update presence
    const now = new Date();
    await update('users', user._id, {
      lastSeen: now.toISOString(),
      workStatus: user.workStatus === 'Offline' ? 'Working' : user.workStatus
    });

    const token = signToken({
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const safeUser = { ...user };
    delete safeUser.password;

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
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
      confirmPassword,
      role
    } = req.body;

    if (!name || !email || !employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, Employee ID, and Password are required.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanEmpId = employeeId.trim().toUpperCase();

    // Check duplicate email
    const existingEmail = await findOne('users', { email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email address already exists.'
      });
    }

    // Check duplicate employeeId
    const existingEmpId = await findOne('users', { employeeId: cleanEmpId });
    if (existingEmpId) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this Employee ID already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Only allow setting ADMIN role if creator is already authenticated admin
    let assignedRole = 'EMPLOYEE';
    if (req.user && req.user.role === 'ADMIN' && role) {
      assignedRole = role;
    }

    const newUser = await create('users', {
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      employeeId: cleanEmpId,
      department: (department || 'Engineering').trim(),
      designation: (designation || 'Software Engineer').trim(),
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      password: hashedPassword,
      role: assignedRole,
      isActive: true,
      workStatus: 'Offline',
      lastSeen: new Date().toISOString()
    });

    if (req.user) {
      await logAudit(req.user, 'EMPLOYEE_CREATED', 'User', newUser._id, {
        name: newUser.name,
        employeeId: newUser.employeeId,
        email: newUser.email,
        role: newUser.role
      });
    }

    const safeUser = { ...newUser };
    delete safeUser.password;

    const token = signToken({
      id: newUser._id,
      role: newUser.role,
      email: newUser.email,
      name: newUser.name
    });

    return res.status(201).json({
      success: true,
      message: 'Employee account registered successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await findById('users', req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    // Get today's attendance for fast dashboard status
    const today = getTodayDateString();
    const todayAttendance = await findOne('attendance', {
      employee: user._id,
      date: today
    });

    return res.json({
      success: true,
      user: safeUser,
      todayAttendance: todayAttendance || null
    });
  } catch (err) {
    next(err);
  }
}

export async function heartbeat(req, res, next) {
  try {
    const { workStatus } = req.body;
    const updateData = {
      lastSeen: new Date().toISOString()
    };

    if (workStatus && ['Offline', 'Working', 'Break', 'Completed'].includes(workStatus)) {
      updateData.workStatus = workStatus;
    }

    const updated = await update('users', req.user._id, updateData);
    return res.json({
      success: true,
      lastSeen: updated?.lastSeen,
      workStatus: updated?.workStatus
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { phone, currentPassword, newPassword } = req.body;
    const user = await findById('users', req.user._id);

    const updateFields = {};
    if (phone !== undefined) updateFields.phone = phone.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password.'
        });
      }

      updateFields.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await update('users', req.user._id, updateFields);
    const safeUser = { ...updated };
    delete safeUser.password;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const user = await findOne('users', { email: email.trim().toLowerCase() });
    if (!user) {
      // Security: do not leak whether email exists
      return res.json({
        success: true,
        message: 'If this email is registered in EHBVS Solutions, reset instructions have been dispatched.'
      });
    }

    await logAudit(null, 'PASSWORD_RESET_REQUESTED', 'User', user._id, { email: user.email });

    return res.json({
      success: true,
      message: 'Password reset request acknowledged. Please contact your system administrator or check corporate email.'
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('token');
  if (req.user) {
    await update('users', req.user._id, {
      workStatus: 'Offline',
      lastSeen: new Date().toISOString()
    });
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
}
