import { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SidebarNav } from '../ui/sidebar-nav';
import { LoadingSpinner } from '../ui/loading-spinner';

type AppLayoutProps = {
  children?: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user && !location.pathname.includes('/auth')) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-8 max-w-full">
        {children || <Outlet />}
      </main>
    </div>
  );
}
