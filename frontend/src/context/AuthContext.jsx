import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ehbvs_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ehbvs_token') || null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const heartbeatTimerRef = useRef(null);

  const refreshMe = useCallback(async () => {
    const currentToken = localStorage.getItem('ehbvs_token');
    if (!currentToken) {
      setUser(null);
      setTodayAttendance(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await authService.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setTodayAttendance(res.todayAttendance || null);
        localStorage.setItem('ehbvs_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUser(null);
        setToken(null);
        setTodayAttendance(null);
        localStorage.removeItem('ehbvs_token');
        localStorage.removeItem('ehbvs_user');
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // Presence Heartbeat
  useEffect(() => {
    if (!user || !token) {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      return;
    }

    // Send immediate heartbeat on mount
    authService.heartbeat().catch(() => {});

    // Every 60 seconds ping presence
    heartbeatTimerRef.current = setInterval(() => {
      authService.heartbeat().catch(() => {});
    }, 60000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [user, token]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success && res.token) {
      localStorage.setItem('ehbvs_token', res.token);
      localStorage.setItem('ehbvs_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshMe();
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (res.success && res.token) {
      localStorage.setItem('ehbvs_token', res.token);
      localStorage.setItem('ehbvs_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshMe();
      return res;
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('ehbvs_token');
      localStorage.removeItem('ehbvs_user');
      setUser(null);
      setToken(null);
      setTodayAttendance(null);
    }
  };

  const updateWorkStatus = async (status) => {
    try {
      const res = await authService.heartbeat(status);
      if (user) {
        const updated = { ...user, workStatus: status };
        setUser(updated);
        localStorage.setItem('ehbvs_user', JSON.stringify(updated));
      }
      return res;
    } catch (err) {
      console.error('Failed to update work status:', err);
    }
  };

  const value = {
    user,
    token,
    todayAttendance,
    loading,
    isAdmin: user?.role === 'ADMIN',
    isEmployee: user?.role === 'EMPLOYEE' || user?.role === 'MANAGER',
    login,
    register,
    logout,
    refreshMe,
    updateWorkStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
