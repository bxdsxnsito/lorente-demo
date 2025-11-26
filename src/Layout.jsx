import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Target,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  TrendingUp,
  Briefcase,
  Shield,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPositionLabel = (position) => {
    const labels = {
      oficial: 'Oficial de Negocios',
      supervisor: 'Supervisor',
      gerente: 'Gerente Comercial',
      admin: 'Administrador'
    };
    return labels[position] || 'Usuario';
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Clientes', icon: Users, page: 'Clients' },
    { name: 'Agenda Comercial', icon: Calendar, page: 'Agenda' },
    { name: 'Oportunidades', icon: Target, page: 'Opportunities' },
    { name: 'Productos', icon: Briefcase, page: 'Products' },
    { name: 'Créditos', icon: TrendingUp, page: 'Loans' },
    { name: 'Tarjetas', icon: CreditCard, page: 'Cards' },
  ];

  const supervisorMenuItems = [
    { name: 'Supervisión', icon: Shield, page: 'Supervision' },
  ];

  const adminMenuItems = [
    { name: 'Administración', icon: Settings, page: 'Admin' },
    { name: 'Controles Demo', icon: FileText, page: 'DeveloperControls' },
  ];

  const allMenuItems = [
    ...menuItems,
    ...(user?.position === 'supervisor' || user?.position === 'gerente' || user?.position === 'admin' ? supervisorMenuItems : []),
    ...(user?.position === 'admin' ? adminMenuItems : [])
  ];

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    return (
      <Link
        to={createPageUrl(item.page)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
          isActive 
            ? "bg-white/15 text-white font-medium shadow-lg shadow-blue-900/20" 
            : "text-blue-100 hover:bg-white/10 hover:text-white"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-blue-200 group-hover:text-white")} />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 221 100% 52%;
          --primary-foreground: 0 0% 100%;
          --sidebar-bg: linear-gradient(180deg, #0B63FF 0%, #0A4DB6 100%);
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0B63FF] to-[#0A4DB6] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-white" />
            <span className="text-white font-bold text-lg">Banca Digital</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8 border-2 border-white/30">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-white/20 text-white text-sm">
              {getInitials(user?.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-40 transition-all duration-300",
        "bg-gradient-to-b from-[#0B63FF] to-[#0A4DB6]",
        collapsed ? "w-20" : "w-64",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn(
          "h-20 flex items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "px-6"
        )}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Banca Digital</h1>
                <p className="text-blue-200 text-xs">Agenda Comercial</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {allMenuItems.map((item) => (
            <NavLink key={item.page} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 border-t border-white/10",
          collapsed ? "px-2" : ""
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors",
                collapsed ? "justify-center" : ""
              )}>
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-white/20 text-white">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm truncate">{user?.full_name || 'Usuario'}</p>
                    <p className="text-blue-200 text-xs truncate">{getPositionLabel(user?.position)}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50">
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Collapse Button - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-24 h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "lg:ml-20" : "lg:ml-64",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}