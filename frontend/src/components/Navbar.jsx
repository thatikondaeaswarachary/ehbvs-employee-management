import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, Menu, LogOut, ChevronDown, UserCheck, Coffee, CheckCircle2, Moon, Building2 } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import StatusBadge from './StatusBadge';
import { company } from '../config/company';

export default function Navbar({ onMenuToggle }) {
  const { user, logout, updateWorkStatus } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    setShowStatusMenu(false);
    try {
      await updateWorkStatus(newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/logo-transparent.png"
              alt={company.name}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-slate-900 tracking-tight text-sm">
              {company.name}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Operations & Monitoring
            </span>
          </div>
        </div>
      </div>

      {/* Right controls: Work Status, Notifications, User & Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Real-time Work Status Toggle (Visible for employee & admin) */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(s => !s)}
              disabled={statusLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
            >
              <StatusBadge status={user.workStatus || 'Offline'} showDot={true} />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                  Set Current Status
                </div>
                <button
                  onClick={() => handleStatusChange('Working')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Working Active
                </button>
                <button
                  onClick={() => handleStatusChange('Break')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600" /> On Short Break
                </button>
                <button
                  onClick={() => handleStatusChange('Completed')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Completed Shift
                </button>
                <button
                  onClick={() => handleStatusChange('Offline')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Moon className="w-3.5 h-3.5 text-slate-400" /> Offline
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(s => !s)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* User Pill & Quick Logout */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'EH'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || 'Authorized User'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {user?.role === 'ADMIN' ? 'System Administrator' : user?.designation || 'Staff Member'}
            </p>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
