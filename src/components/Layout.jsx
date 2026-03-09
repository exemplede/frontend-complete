import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreesIcon, LayoutDashboard, MapPin, Calendar, AlertTriangle, Wrench, Users, Package, BarChart3, LogOut, Menu, X, Box } from 'lucide-react';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const nav = [
    { name: 'Tableau de bord', to: '/', icon: LayoutDashboard, roles: ['all'] },
    { name: 'Espaces verts', to: '/espaces', icon: MapPin, roles: ['all'] },
    { name: 'Interventions', to: '/interventions', icon: Calendar, roles: ['all'] },
    { name: 'Signalements', to: '/signalements', icon: AlertTriangle, roles: ['all'] },
    { name: 'Équipements', to: '/equipements', icon: Wrench, roles: ['all'] },
    { name: 'Équipes', to: '/equipes', icon: Users, roles: ['GestionnaireGlobal', 'Maire'] },
    { name: 'Matériel', to: '/materiel', icon: Box, roles: ['GestionnaireGlobal', 'Maire'] },
    { name: 'Stock', to: '/stock', icon: Package, roles: ['GestionnaireGlobal', 'Maire'] },
    { name: 'Statistiques', to: '/statistiques', icon: BarChart3, roles: ['GestionnaireGlobal', 'Maire'] },
  ];

  const canAccess = (item) => item.roles.includes('all') || user?.groups?.some(g => item.roles.includes(g));
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const NavLinks = ({ onClick }) => nav.filter(canAccess).map(item => (
    <Link key={item.to} to={item.to} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.to) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
      <item.icon className={`w-5 h-5 ${isActive(item.to) ? 'text-green-600' : ''}`}/>{item.name}
    </Link>
  ));

  const SidebarInner = ({ onLink }) => (
    <>
      <div className="flex items-center gap-2.5 px-4 h-16 border-b">
        <div className="p-1.5 bg-green-600 rounded-lg"><TreesIcon className="w-5 h-5 text-white"/></div>
        <span className="text-lg font-bold">Green City</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"><NavLinks onClick={onLink}/></nav>
      <div className="px-3 py-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username}</div>
            <div className="text-xs text-gray-500 truncate">{user?.groups?.[0] || 'Utilisateur'}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
            <SidebarInner onLink={() => setSidebarOpen(false)}/>
          </div>
        </div>
      )}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r"><SidebarInner/></aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white/95 backdrop-blur border-b lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"><Menu className="w-5 h-5"/></button>
          <div className="flex-1"/>
          <div className="flex items-center gap-2">
            <NotificationPanel/>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="Déconnexion">
              <LogOut className="w-4 h-4"/><span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>
        <main className="p-4 lg:p-8"><Outlet/></main>
      </div>
    </div>
  );
}
