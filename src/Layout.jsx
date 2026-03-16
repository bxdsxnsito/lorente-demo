import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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
  Bell,
  Calculator,
  Brain,
  MapPin
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
import { toast } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch App Config
  const { data: configs } = useQuery({
    queryKey: ['appConfig'],
    queryFn: () => base44.entities.AppConfig.list(),
  });

  const appConfig = configs?.[0] || {
    appName: 'Bancop',
    primaryColor: '#1565C0',
    secondaryColor: '#0D47A1'
  };

  // Apply Favicon and Title
  useEffect(() => {
    if (appConfig.appName) {
      document.title = appConfig.appName;
    }
    if (appConfig.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = appConfig.faviconUrl;
    }
  }, [appConfig]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        // Intentar buscar el AppUser vinculado
        const appUsers = await base44.entities.AppUser.list();
        const linkedAppUser = appUsers.find(au => au.user_id === currentUser.id || au.email === currentUser.email);

        // Si existe AppUser vinculado, usar sus datos prioritariamente
        if (linkedAppUser) {
           setUser({ ...currentUser, ...linkedAppUser });
        } else {
           setUser(currentUser);
        }
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
    { name: 'Agenda Comercial', icon: Calendar, page: 'Agenda' },
    { name: 'Pipeline', icon: Target, page: 'Opportunities' },
    { name: 'Clientes', icon: Users, page: 'Clients' },
    { name: 'Análisis IA', icon: Brain, page: 'AIAnalysis' },
    { name: 'Créditos', icon: TrendingUp, page: 'Loans' },
    { name: 'Tarjetas', icon: CreditCard, page: 'Cards' },
    { name: 'Productos', icon: Briefcase, page: 'Products' },
    { name: 'Simuladores', icon: Calculator, page: 'ProductSimulator' },
    { name: 'Ruta del Día', icon: MapPin, page: 'RouteMap' },
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
            ? "bg-white/20 text-white font-semibold shadow-lg border-l-4 border-orange-400" 
            : "text-blue-100 hover:bg-white/10 hover:text-white"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-orange-300" : "text-blue-200 group-hover:text-white")} />
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
          --sidebar-bg: linear-gradient(180deg, ${appConfig.primaryColor} 0%, ${appConfig.secondaryColor} 100%);
        }
      `}</style>

      {/* Mobile Header */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4"
        style={{ background: `linear-gradient(to right, ${appConfig.primaryColor}, ${appConfig.secondaryColor})` }}
      >
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
            {appConfig.logoUrl ? (
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                <img src={appConfig.logoUrl} alt="Logo" className="h-7 w-7 object-contain" />
              </div>
            ) : (
              <Building2 className="h-7 w-7 text-white" />
            )}
            <span className="text-white font-bold text-lg">{appConfig.appName}</span>
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
      <aside 
        className={cn(
            "fixed top-0 left-0 h-full z-40 transition-all duration-300",
            collapsed ? "w-20" : "w-64",
            "lg:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: `linear-gradient(to bottom, ${appConfig.primaryColor}, ${appConfig.secondaryColor})` }}
      >
        {/* Logo */}
        <div className={cn(
          "h-20 flex items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "px-6"
        )}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                {appConfig.logoUrl ? (
                    <img src={appConfig.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                ) : (
                    <Building2 className="h-6 w-6 text-blue-700" />
                )}
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">{appConfig.appName}</h1>
                <p className="text-blue-200 text-xs">Crece desde la raíz</p>
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Profile')} className="cursor-pointer w-full flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Settings')} className="cursor-pointer w-full flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
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