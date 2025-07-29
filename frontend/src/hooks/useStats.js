import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export const useStats = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalClients: 0,
    pendingInvoices: 0,
    loading: true
  });

  const fetchStats = async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.INVOICES),
        axios.get(API_ENDPOINTS.CLIENTS)
      ]);

      const invoices = invoicesRes.data.invoices || [];
      const clients = clientsRes.data.clients || [];

      // Calcular estadísticas reales
      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      const totalClients = clients.length;
      const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;

      setStats({
        totalInvoices,
        totalRevenue,
        totalClients,
        pendingInvoices,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, refetchStats: fetchStats };
};
