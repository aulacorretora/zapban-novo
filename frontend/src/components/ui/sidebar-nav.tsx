import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  BarChart3,
  Phone, 
  LogOut,
  Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBreakpoint } from '../../hooks/use-responsive';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator
} from './sidebar';
import { Button } from '@/components/ui/button';

export function SidebarNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isMobile } = useBreakpoint();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={isMobile ? "w-[70px] sm:w-[250px]" : "w-[250px]"}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-lg font-bold text-primary-foreground">Z</span>
          </div>
          <div className={`flex flex-col ${isMobile ? "hidden sm:flex" : ""}`}>
            <span className="text-lg font-bold">ZapBan</span>
            <span className="text-xs text-muted-foreground">WhatsApp Manager</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive('/dashboard')}>
              <Link to="/dashboard">
                <LayoutDashboard className={isMobile ? "mx-auto" : ""} />
                <span className={isMobile ? "hidden sm:inline" : ""}>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive('/instances')}>
              <Link to="/instances">
                <Phone className={isMobile ? "mx-auto" : ""} />
                <span className={isMobile ? "hidden sm:inline" : ""}>WhatsApp Instances</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive('/chat')}>
              <Link to="/chat">
                <MessageSquare className={isMobile ? "mx-auto" : ""} />
                <span className={isMobile ? "hidden sm:inline" : ""}>Chats</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive('/templates')}>
              <Link to="/templates">
                <FileText className={isMobile ? "mx-auto" : ""} />
                <span className={isMobile ? "hidden sm:inline" : ""}>Templates</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive('/statistics')}>
              <Link to="/statistics">
                <BarChart3 className={isMobile ? "mx-auto" : ""} />
                <span className={isMobile ? "hidden sm:inline" : ""}>Statistics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Admin link - only visible for admin users */}
          {(user?.user_metadata?.role === 'admin' || localStorage.getItem('userRole') === 'admin') && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild data-active={isActive('/admin')}>
                <Link to="/admin">
                  <Users className={isMobile ? "mx-auto" : ""} />
                  <span className={isMobile ? "hidden sm:inline" : ""}>Admin Panel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={signOut}
        >
          <LogOut className={`h-4 w-4 ${isMobile ? "mx-auto" : "mr-2"}`} />
          <span className={isMobile ? "hidden sm:inline" : ""}>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
