import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { company } from '../config/company';

export default function AuthLayout() {
  const { user, isAdmin, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle corporate geometric background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <div className="flex justify-center mb-4">
          <div className="p-2.5 bg-white rounded-2xl shadow-xl shadow-blue-500/20 border border-slate-100 inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt={company.name}
              className="h-16 w-auto max-w-[190px] object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {company.name}
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          {company.description}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-100">
          <Outlet />
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {company.legalName}. All rights reserved.</p>
          <p className="mt-1 text-[11px] text-slate-400">Strict corporate security & active audit logging enforced.</p>
        </div>
      </div>
    </div>
  );
}
