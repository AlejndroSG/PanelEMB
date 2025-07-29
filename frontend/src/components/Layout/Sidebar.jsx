import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Building2,
  CreditCard,
  X,
  User,
  TrendingUp,
  Shield
} from 'lucide-react';
import logoEMB from '../../assets/logoEMB.png';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard
    },
    {
      name: 'Facturas',
      href: '/invoices',
      icon: FileText
    },
    {
      name: 'Clientes',
      href: '/clients',
      icon: Users
    },
    {
      name: 'Servicios',
      href: '/services',
      icon: CreditCard
    }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 shadow-2xl h-full flex flex-col">
      {/* Header con logo profesional */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoEMB} alt="EMB" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-white">EMB</h1>
              <p className="text-xs text-blue-200">Billing System</p>
            </div>
          </div>
          
          {/* Botón cerrar para móviles */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate">{item.name}</span>
              {({ isActive }) => isActive && (
                <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full"></div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sección de usuario */}
      <div className="p-4 border-t border-white/10">
        {/* Información del usuario */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-blue-200 truncate">{user?.email || 'admin@emb.com'}</p>
            </div>
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-white">24</div>
              <div className="text-xs text-blue-200">Facturas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">€2.4k</div>
              <div className="text-xs text-blue-200">Total</div>
            </div>
          </div>
        </div>
        
        {/* Botón de logout */}
        <button
          onClick={() => {
            handleLogout();
            onClose && onClose();
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/40"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
