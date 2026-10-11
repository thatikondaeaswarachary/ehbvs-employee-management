import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id, link) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      if (link) {
        onClose();
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-blue-600 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No notifications at this time.</div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif._id}
              onClick={() => handleMarkRead(notif._id, notif.link)}
              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                notif.read ? 'opacity-70' : 'bg-blue-50/20'
              }`}
            >
              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
