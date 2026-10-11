import { list, findById, create, update, remove } from '../repositories/store.js';
import { logAudit } from '../utils/auditLogger.js';

export async function createAnnouncement(req, res, next) {
  try {
    const { title, message, audience = 'All Employees', department = '', employee = null, priority = 'Medium' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title and message are required.'
      });
    }

    const announcement = await create('announcements', {
      title: title.trim(),
      message: message.trim(),
      audience,
      department: department.trim(),
      employee: employee || null,
      priority,
      createdBy: req.user._id
    });

    // Broadcast notifications to target audience
    const allUsers = await list('users', { isActive: true });
    let recipients = [];

    if (audience === 'All Employees') {
      recipients = allUsers;
    } else if (audience === 'Department' && department) {
      recipients = allUsers.filter(u => u.department === department);
    } else if (audience === 'Specific Employee' && employee) {
      recipients = allUsers.filter(u => String(u._id) === String(employee));
    }

    for (const recipient of recipients) {
      await create('notifications', {
        user: recipient._id,
        title: `Announcement: ${title}`,
        message: message.slice(0, 120) + (message.length > 120 ? '...' : ''),
        type: 'announcement',
        link: '/employee/dashboard'
      });
    }

    await logAudit(req.user, 'ANNOUNCEMENT_CREATED', 'Announcement', announcement._id, {
      title,
      audience,
      recipientsCount: recipients.length
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncements(req, res, next) {
  try {
    let announcements = await list('announcements', {}, { createdAt: -1 });

    if (req.user.role !== 'ADMIN') {
      // Filter for employee
      announcements = announcements.filter(a => {
        if (a.audience === 'All Employees') return true;
        if (a.audience === 'Department' && a.department === req.user.department) return true;
        if (a.audience === 'Specific Employee' && String(a.employee?._id || a.employee) === String(req.user._id)) return true;
        return false;
      });
    }

    return res.json({
      success: true,
      count: announcements.length,
      announcements
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const { title, message, audience, department, priority } = req.body;

    const existing = await findById('announcements', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const updated = await update('announcements', id, {
      ...(title && { title: title.trim() }),
      ...(message && { message: message.trim() }),
      ...(audience && { audience }),
      ...(department !== undefined && { department: department.trim() }),
      ...(priority && { priority })
    });

    await logAudit(req.user, 'ANNOUNCEMENT_UPDATED', 'Announcement', id, { title: updated.title });

    return res.json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await findById('announcements', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    await remove('announcements', id);
    await logAudit(req.user, 'ANNOUNCEMENT_DELETED', 'Announcement', id, { title: existing.title });

    return res.json({
      success: true,
      message: 'Announcement deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
