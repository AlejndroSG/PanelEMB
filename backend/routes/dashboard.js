const express = require('express');
const db = require('../config/jsondb');
const authRouter = require('./auth');
const verifyToken = authRouter.verifyToken;

const router = express.Router();

// Función helper para calcular el total de una factura
function calculateInvoiceTotal(invoice) {
  if (!invoice.items || invoice.items.length === 0) {
    return 0;
  }
  
  return invoice.items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 1;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const ivaRate = parseFloat(item.iva_rate) || 0;
    
    const subtotal = quantity * unitPrice;
    const iva = subtotal * (ivaRate / 100);
    
    return sum + subtotal + iva;
  }, 0);
}

// Dashboard principal con estadísticas REALES
router.get('/', verifyToken, (req, res) => {
  try {
    const data = db.readData();
    const totalInvoices = data.invoices.length;
    const totalClients = data.clients.length;
    const totalServices = data.services.length;
    
    // Calcular ingresos totales correctamente
    const totalRevenue = data.invoices.reduce((sum, invoice) => {
      return sum + calculateInvoiceTotal(invoice);
    }, 0);
    
    // Facturas recientes con nombres de clientes
    const recentInvoices = data.invoices.slice(-5).reverse().map(invoice => {
      const client = data.clients.find(c => c.id === invoice.client_id) || {};
      const total = calculateInvoiceTotal(invoice);
      
      return {
        ...invoice,
        client_name: client.name || 'Cliente desconocido',
        total: Math.round(total * 100) / 100
      };
    });
    
    // Estadísticas por estado
    const invoicesByStatus = {
      pending: data.invoices.filter(inv => inv.status === 'pending').length,
      paid: data.invoices.filter(inv => inv.status === 'paid').length,
      overdue: data.invoices.filter(inv => inv.status === 'overdue').length,
      cancelled: data.invoices.filter(inv => inv.status === 'cancelled').length
    };
    
    // Servicios más utilizados
    const serviceUsage = {};
    data.invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const service = data.services.find(s => s.id === item.service_id);
        if (service) {
          if (!serviceUsage[service.name]) {
            serviceUsage[service.name] = { count: 0, revenue: 0 };
          }
          serviceUsage[service.name].count += item.quantity;
          serviceUsage[service.name].revenue += item.quantity * item.unit_price * (1 + item.iva_rate / 100);
        }
      });
    });
    
    const topServices = Object.entries(serviceUsage)
      .map(([name, data]) => ({
        service_name: name,
        total_usage: data.count,
        total_revenue: Math.round(data.revenue * 100) / 100
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);
    
    // Ingresos por mes (últimos 6 meses)
    const monthlyRevenues = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthInvoices = data.invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd;
      });
      
      const monthRevenue = monthInvoices.reduce((sum, invoice) => {
        return sum + calculateInvoiceTotal(invoice);
      }, 0);
      
      monthlyRevenues.push({
        month: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        revenue: Math.round(monthRevenue * 100) / 100
      });
    }
    
    res.json({
      dashboard: {
        overview: {
          totalInvoices,
          totalClients,
          totalServices,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingInvoices: invoicesByStatus.pending,
          paidInvoices: invoicesByStatus.paid,
          overdueInvoices: invoicesByStatus.overdue
        },
        recentInvoices,
        topServices,
        monthlyRevenues
      }
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error interno en dashboard' });
  }
});

// Estadísticas por cliente
router.get('/client-stats', verifyToken, (req, res) => {
  try {
    const data = db.readData();
    
    const clientStats = data.clients.map(client => {
      const clientInvoices = data.invoices.filter(inv => inv.client_id === client.id);
      const totalRevenue = clientInvoices.reduce((sum, invoice) => {
        return sum + calculateInvoiceTotal(invoice);
      }, 0);
      
      return {
        client_name: client.name,
        total_invoices: clientInvoices.length,
        total_revenue: Math.round(totalRevenue * 100) / 100
      };
    });
    
    res.json(clientStats);
  } catch (error) {
    console.error('Error en estadísticas de clientes:', error);
    res.status(500).json({ error: 'Error interno en estadísticas de clientes' });
  }
});

// Estadísticas por servicio
router.get('/service-stats', verifyToken, (req, res) => {
  try {
    const data = db.readData();
    
    const serviceStats = data.services.map(service => {
      let totalQuantity = 0;
      let totalRevenue = 0;
      
      data.invoices.forEach(invoice => {
        invoice.items.forEach(item => {
          if (item.service_id === service.id) {
            const quantity = parseFloat(item.quantity) || 1;
            const unitPrice = parseFloat(item.unit_price) || 0;
            const ivaRate = parseFloat(item.iva_rate) || 0;
            
            totalQuantity += quantity;
            const subtotal = quantity * unitPrice;
            const iva = subtotal * (ivaRate / 100);
            totalRevenue += subtotal + iva;
          }
        });
      });
      
      return {
        service_name: service.name,
        total_quantity: totalQuantity,
        total_revenue: Math.round(totalRevenue * 100) / 100
      };
    });
    
    res.json(serviceStats);
  } catch (error) {
    console.error('Error en estadísticas de servicios:', error);
    res.status(500).json({ error: 'Error interno en estadísticas de servicios' });
  }
});

// Ingresos por período
router.get('/revenue-by-period', verifyToken, (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    const data = db.readData();
    
    const revenueByPeriod = {};
    
    data.invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.issue_date);
      const invoiceYear = invoiceDate.getFullYear();
      
      if (invoiceYear === parseInt(year)) {
        let periodKey;
        
        if (period === 'month') {
          periodKey = `${invoiceYear}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
        } else {
          periodKey = `${invoiceYear}-Q${Math.ceil((invoiceDate.getMonth() + 1) / 3)}`;
        }
        
        if (!revenueByPeriod[periodKey]) {
          revenueByPeriod[periodKey] = 0;
        }
        
        revenueByPeriod[periodKey] += calculateInvoiceTotal(invoice);
      }
    });
    
    // Convertir a array y redondear
    const result = Object.entries(revenueByPeriod).map(([period, revenue]) => ({
      period,
      revenue: Math.round(revenue * 100) / 100
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error en ingresos por período:', error);
    res.status(500).json({ error: 'Error interno en ingresos por período' });
  }
});

module.exports = router;
