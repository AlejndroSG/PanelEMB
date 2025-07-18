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
  XCircle
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emb-600"></div>
      </div>
    );
  }

  const { overview, recentInvoices, topServices, monthlyRevenues } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu actividad de facturación</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalClients || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-emb-100 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-emb-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overview?.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.pendingInvoices || 0}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(overview?.pendingAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Este Mes</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Facturas creadas</span>
              <span className="font-semibold">{overview?.monthlyInvoices || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ingresos del mes</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(overview?.monthlyRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Facturas vencidas</span>
              <span className="font-semibold text-red-600">
                {overview?.overdueInvoices || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Más Vendidos</h3>
          <div className="space-y-3">
            {topServices?.slice(0, 5).map((service, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.count} ventas</p>
                </div>
                <span className="font-semibold text-emb-600">
                  {formatCurrency(service.revenue)}
                </span>
              </div>
            ))}
            {(!topServices || topServices.length === 0) && (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Facturas Recientes</h3>
          <a href="/invoices" className="text-emb-600 hover:text-emb-700 text-sm font-medium">
            Ver todas
          </a>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Número</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Total</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices?.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{invoice.invoice_number}</td>
                  <td className="table-cell">{invoice.client_name}</td>
                  <td className="table-cell">{formatDate(invoice.issue_date)}</td>
                  <td className="table-cell font-semibold">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(invoice.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!recentInvoices || recentInvoices.length === 0) && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay facturas recientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
