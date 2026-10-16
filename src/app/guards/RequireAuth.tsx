import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="flex justify-center items-center gap-1 mb-4">
            <span className="text-2xl font-black text-[#FF8C00]">Code</span>
            <span className="text-2xl font-black text-[#111111]">Crew</span>
          </div>
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && !profile.active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-base font-bold text-red-800">Account Deactivated</h2>
          <p className="mt-2 text-sm text-red-600">
            Your account has been deactivated by the administrator. Please contact CodeCrew support.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
