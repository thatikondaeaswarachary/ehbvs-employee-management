import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminEmployeeDetails from './pages/admin/EmployeeDetails';
import AdminAttendance from './pages/admin/Attendance';
import AdminTasks from './pages/admin/Tasks';
import AdminWorkReports from './pages/admin/WorkReports';
import AdminLeaveManagement from './pages/admin/LeaveManagement';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminNotifications from './pages/admin/Notifications';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeTasks from './pages/employee/Tasks';
import EmployeeTaskDetails from './pages/employee/TaskDetails';
import EmployeeWorkReport from './pages/employee/WorkReport';
import EmployeeLeave from './pages/employee/Leave';
import EmployeeProfile from './pages/employee/Profile';
import EmployeeNotifications from './pages/employee/Notifications';

function RootRedirect() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
        Initializing EHBVS Solutions...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Authentication routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Admin Protected routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="employees/:id" element={<AdminEmployeeDetails />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="work-reports" element={<AdminWorkReports />} />
            <Route path="leave" element={<AdminLeaveManagement />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Employee Protected routes */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="tasks/:id" element={<EmployeeTaskDetails />} />
            <Route path="work-report" element={<EmployeeWorkReport />} />
            <Route path="leave" element={<EmployeeLeave />} />
            <Route path="profile" element={<EmployeeProfile />} />
            <Route path="notifications" element={<EmployeeNotifications />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
