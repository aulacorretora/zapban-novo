import { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SidebarNav } from '../ui/sidebar-nav';
import { LanguageSwitcher } from '../ui/language-switcher';

type AppLayoutProps = {
  children?: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 max-w-full">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
