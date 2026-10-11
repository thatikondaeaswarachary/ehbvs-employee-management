import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success) setNotifications(res.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    fetchNotifs();
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif._id);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Task deliverables assignments, leave review decisions, and corporate alerts.
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
        >
          <CheckCheck className="w-4 h-4" />
          Mark All As Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-12"><LoadingSpinner message="Loading notifications..." /></div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            You have no notifications at this time.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition ${
                n.read ? 'bg-white' : 'bg-blue-50/25'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${n.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {n.link && (
                <span className="p-1 text-slate-400 hover:text-blue-600 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
