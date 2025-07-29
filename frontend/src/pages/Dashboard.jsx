import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Euro,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.DASHBOARD);
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-badge status-pending', icon: Clock, text: 'Pendiente' },
      paid: { class: 'status-badge status-paid', icon: CheckCircle, text: 'Pagada' },
      overdue: { class: 'status-badge status-overdue', icon: AlertTriangle, text: 'Vencida' },
      cancelled: { class: 'status-badge status-cancelled', icon: XCircle, text: 'Cancelada' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={badge.class}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 font-medium">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  const { overview, recentInvoices, topServices, monthlyRevenues } = dashboardData || {};

  return (
    <div className="space-y-8">
      {/* Header Profesional */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
            <p className="text-blue-100 text-lg">Bienvenido al sistema de facturación EMB</p>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="mt-6 lg:mt-0 flex space-x-4">
            <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Exportar</span>
            </button>
            <button className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Nueva Factura</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas Profesionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Clientes */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{overview?.totalClients || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 text-sm font-medium">+12%</span>
                <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Total Facturas */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Facturas</p>
              <p className="text-3xl font-bold text-gray-900">{overview?.totalInvoices || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 text-sm font-medium">+8%</span>
                <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(overview?.totalRevenue)}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 text-sm font-medium">+15%</span>
                <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Facturas Pendientes */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900">{overview?.pendingInvoices || 0}</p>
              <p className="text-orange-600 text-sm font-medium mt-1">
                {formatCurrency(overview?.pendingAmount)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estadísticas del Mes */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Resumen del Mes</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{overview?.monthlyInvoices || 0}</p>
              <p className="text-sm text-gray-600">Facturas Creadas</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.monthlyRevenue)}</p>
              <p className="text-sm text-gray-600">Ingresos del Mes</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
              <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{overview?.overdueInvoices || 0}</p>
              <p className="text-sm text-gray-600">Facturas Vencidas</p>
            </div>
          </div>
        </div>

        {/* Top Servicios */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Servicios</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {topServices?.slice(0, 5).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.count} ventas</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">
                  {formatCurrency(service.revenue)}
                </span>
              </div>
            ))}
            {(!topServices || topServices.length === 0) && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Facturas Recientes */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Facturas Recientes</h3>
              <p className="text-sm text-gray-500">Actividad reciente de facturación</p>
            </div>
          </div>
          <a 
            href="/invoices" 
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Ver todas</span>
          </a>
        </div>
        
        {/* Vista de tabla profesional para desktop */}
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Factura</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices?.map((invoice, index) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">#{invoice.invoice_number}</p>
                          <p className="text-xs text-gray-500">Factura</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invoice.client_name}</p>
                          <p className="text-xs text-gray-500">Cliente</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista de cards para tablet y móvil */}
        <div className="lg:hidden space-y-4">
          {recentInvoices?.map((invoice, index) => (
            <div key={invoice.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">#{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">{invoice.client_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.total)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(invoice.issue_date)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {getStatusBadge(invoice.status)}
                <div className="flex space-x-2">
                  <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
          
        {(!recentInvoices || recentInvoices.length === 0) && (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay facturas recientes</h4>
            <p className="text-gray-500 mb-4">Crea tu primera factura para comenzar</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200">
              Crear Factura
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
