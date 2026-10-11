import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CheckSquare,
  FileText,
  CalendarDays,
  Megaphone,
  Bell,
  BarChart3,
  Settings,
  User,
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';
import { company } from '../config/company';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
    { name: 'Work Reports', path: '/admin/work-reports', icon: FileText },
    { name: 'Leave', path: '/admin/leave', icon: CalendarDays },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const employeeNav = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'My Attendance', path: '/employee/attendance', icon: CalendarCheck },
    { name: 'My Tasks', path: '/employee/tasks', icon: CheckSquare },
    { name: 'Work Report', path: '/employee/work-report', icon: FileText },
    { name: 'Leave', path: '/employee/leave', icon: CalendarDays },
    { name: 'Notifications', path: '/employee/notifications', icon: Bell },
    { name: 'My Profile', path: '/employee/profile', icon: User }
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/logo-transparent.png"
                alt={company.name}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm">
                {company.name}
              </span>
              <span className="block text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                {isAdmin ? 'Admin Console' : 'Employee Portal'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview pill */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'EH'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {isAdmin ? 'System Administrator' : user?.employeeId || 'Employee'}
            </p>
          </div>
          {isAdmin && (
            <span title="Administrator">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </span>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
