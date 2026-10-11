import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { Bell, Check, Clock, CheckCheck, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleMarkSingle = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System & Event Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time audit alerts, leave submissions, deliverable updates, and presence pings.
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
          <div className="py-12"><LoadingSpinner message="Fetching notifications..." /></div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No system notifications at this time.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                n.read ? 'bg-white' : 'bg-blue-50/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-xl shrink-0 ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
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

              {!n.read && (
                <button
                  onClick={() => handleMarkSingle(n._id)}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md shrink-0 transition"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
