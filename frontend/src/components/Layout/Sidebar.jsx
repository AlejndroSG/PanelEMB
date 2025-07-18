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
  CreditCard
} from 'lucide-react';

const Sidebar = () => {
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
      {/* Logo y empresa */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-emb-600 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EMB</h1>
            <p className="text-sm text-gray-500">Sistema de Facturación</p>
          </div>
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
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-emb-50 text-emb-700 border-r-2 border-emb-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Usuario y logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-gray-200 p-2 rounded-full">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
