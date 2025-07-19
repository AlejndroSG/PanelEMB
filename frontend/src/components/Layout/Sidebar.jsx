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
  X
} from 'lucide-react';

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
    <div className="bg-white shadow-sm border-r border-gray-200 h-full flex flex-col">
      {/* Header con logo y botón cerrar móvil */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emb-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">EMB</h1>
              <p className="text-xs sm:text-sm text-gray-500">Sistema de Facturación</p>
            </div>
          </div>
          
          {/* Botón cerrar para móviles */}
          <button
            type="button"
            className="lg:hidden -mr-2 -mt-2 h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar sidebar</span>
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose} // Cerrar sidebar en móvil al hacer clic
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-emb-50 text-emb-700 border-r-2 border-emb-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Usuario y logout */}
      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-gray-200 p-2 rounded-full flex-shrink-0">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@emb.com'}</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            handleLogout();
            onClose && onClose(); // Cerrar sidebar en móvil
          }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 sm:py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
