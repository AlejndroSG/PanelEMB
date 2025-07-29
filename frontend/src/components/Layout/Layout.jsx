import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoEMB from '../../assets/logoEMB.png';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default, visible on desktop */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Profesional */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Logo y Título */}
              <div className="flex items-center space-x-3">
                <img src={logoEMB} alt="EMB" className="h-8 w-auto" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    EMB Billing System
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Sistema Profesional de Facturación</p>
                </div>
              </div>
            </div>
            
            {/* Barra de herramientas */}
            <div className="flex items-center space-x-3">
              {/* Fecha */}
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('es-ES', {
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Notificaciones */}
              <button className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Perfil de Usuario */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    info
                  </div>
                  <div className="text-xs text-gray-500">
                    info@embdevs.com
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200 ml-2"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50/50 to-white/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
