import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

export const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0f2e]">
        <RefreshCw className="h-8 w-8 text-[#C9A96E] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // If logged in but not an admin, sign out and go to login
    signOut();
    return <Navigate to="/admin/login" state={{ error: 'Acesso negado. Apenas administradores podem acessar esta área.' }} replace />;
  }

  return <>{children}</>;
};
