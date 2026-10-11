import { list, findById, update } from '../repositories/store.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user._id;
    const notifications = await list('notifications', { user: userId }, { createdAt: -1 });
    const unreadCount = notifications.filter(n => !n.read).length;

    return res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await findById('notifications', id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const notifUserId = notification.user?._id || notification.user;
    if (String(notifUserId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updated = await update('notifications', id, { read: true });

    return res.json({
      success: true,
      notification: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user._id;
    const userNotifications = await list('notifications', { user: userId });

    for (const notif of userNotifications) {
      if (!notif.read) {
        await update('notifications', notif._id, { read: true });
      }
    }

    return res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
}
