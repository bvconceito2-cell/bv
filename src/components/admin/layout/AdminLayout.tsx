import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useStore } from '../../../store/useStore';
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
  BarChart3,
  Image as ImageIcon,
  Layout as LayoutIcon,
  Palette,
  Settings,
  LogOut,
  Target,
  Ticket,
  ChevronRight,
  TrendingUp,
  Plug,
  ShieldAlert,
  Bell,
  Menu,
  ShieldCheck,
  ExternalLink,
  FileText
} from 'lucide-react';

import { toast } from 'sonner';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-6 py-3 text-sm transition-all ${
      active
        ? 'bg-[#04548c] text-white border-r-4 border-white'
        : 'text-slate-400 hover:bg-[#0b5f99] hover:text-white'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
    {active && <ChevronRight className="ml-auto h-4 w-4" />}
  </Link>
);

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { config }: any = useStore();

  const handleSignOut = async () => {
    await signOut();
    toast.info('Sessão encerrada.');
    navigate('/admin/login');
  };

  const menuItems = [
    { section: 'PAINEL', items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { section: 'CATÁLOGO', items: [
      { to: '/admin/produtos', icon: Package, label: 'Produtos' },
      { to: '/admin/categorias', icon: Tag, label: 'Categorias' },
    ]},
    { section: 'VENDAS', items: [
      { to: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos' },
      { to: '/admin/clientes', icon: Users, label: 'Clientes' },
      { to: '/admin/crm', icon: BarChart3, label: 'CRM' },
    ]},
    { section: 'CONTEÚDO', items: [
      { to: '/admin/banners', icon: ImageIcon, label: 'Banners' },
      { to: '/admin/banners/hero', icon: ImageIcon, label: '└─ Hero' },
      { to: '/admin/banners/editorial', icon: ImageIcon, label: '└─ Editorial' },
      { to: '/admin/banners/categorias', icon: ImageIcon, label: '└─ Categorias' },
      { to: '/admin/secoes', icon: LayoutIcon, label: 'Seções da Home' },
      { to: '/admin/paginas', icon: FileText, label: 'Páginas Institucionais' },
      { to: '/admin/aparencia', icon: Palette, label: 'Aparência' },
    ]},
    { section: 'MARKETING', items: [
      { to: '/admin/marketing', icon: Target, label: 'Marketing' },
      { to: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    ]},
    { section: 'SISTEMA', items: [
      { to: '/admin/integracoes', icon: Plug, label: 'Integrações' },
      { to: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
      { to: '/admin/relatorios', icon: TrendingUp, label: 'Relatórios' },
      { to: '/admin/diagnostico-template', icon: ShieldCheck, label: 'Diagnóstico QA' },
      { to: '/admin/logs', icon: ShieldAlert, label: 'Logs do Sistema' },
    ]},
  ];

  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.lida).length;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes_admin' }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        toast.message(payload.new.titulo, {
          description: payload.new.mensagem,
          action: payload.new.link ? {
            label: 'Ver',
            onClick: () => navigate(payload.new.link)
          } : undefined
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notificacoes_admin')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setNotifications(data);
  };

  return (
    <div className="admin-theme flex h-screen overflow-hidden relative bg-[#F8F9FA] text-[#111827]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#04548c] text-white flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold tracking-tight text-white">
            {config?.nome_loja?.split(' ')[0] || 'ADMIN'}
          </span>
          <span className="text-[10px] bg-white text-[#04548c] px-1 rounded font-bold">
            ADMIN
          </span>
        </div>

        <nav className="flex-1">
          {menuItems.map((section, idx) => (
            <div key={idx} className="mb-4">
              <p className="px-6 text-[10px] font-bold text-slate-300 mb-2 tracking-widest">
                {section.section}
              </p>

              {section.items.map((item) => (
                <SidebarItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname.startsWith(item.to)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-2 py-2 text-sm text-slate-300 hover:text-white transition-all"
          >
            <LogOut className="h-5 w-5 rotate-180" />
            <span>Voltar à Loja</span>
          </Link>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-[#04548c] lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
              Admin / <span className="text-gray-800">{location.pathname.split('/').pop()}</span>
            </h2>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#04548c] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#03426d] transition-all shadow-sm ml-2"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">Ver Loja</span>
            </a>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group/notif">
              <button className="p-2 text-gray-400 hover:text-[#04548c] transition-all relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#E8816A] text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 hidden group-hover/notif:block overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Notificações
                  </h4>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-8 text-center text-[10px] font-bold text-gray-400 uppercase">
                      Nenhuma notificação
                    </p>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={i}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !n.lida ? 'bg-[#04548c]/5' : ''
                        }`}
                      >
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                          {n.titulo}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                          {n.mensagem}
                        </p>
                        <p className="text-[8px] text-gray-400 uppercase mt-2">
                          {new Date(n.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-800 uppercase tracking-tight">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  Master Admin
                </p>
              </div>

              <div className="h-10 w-10 rounded-full bg-[#04548c] flex items-center justify-center text-white font-black uppercase shadow-inner">
                {user?.email?.[0] || 'A'}
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-500 transition-all ml-2"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
