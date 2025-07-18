const fs = require('fs');
const path = require('path');

console.log('🔧 INICIANDO CORRECCIÓN COMPLETA DEL SISTEMA...\n');

// 1. Corregir datos de la base de datos
const dataPath = path.join(__dirname, 'backend/database/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('1. Corrigiendo datos de facturas...');

// Corregir facturas para que tengan IVA válido y client_id como número
data.invoices = data.invoices.map(invoice => {
  return {
    ...invoice,
    client_id: parseInt(invoice.client_id), // Convertir a número
    items: invoice.items.map(item => ({
      ...item,
      iva_rate: item.iva_rate === null ? 21 : item.iva_rate // Corregir IVA null
    }))
  };
});

// Guardar datos corregidos
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('✅ Datos de facturas corregidos');

// 2. Crear archivo de configuración mejorado para el backend
const backendRouteContent = `const express = require('express');
const db = require('../config/jsondb');
const authRouter = require('./auth');
const verifyToken = authRouter.verifyToken;

const router = express.Router();

// Obtener todas las facturas con nombres de clientes y totales calculados
router.get('/', verifyToken, (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    const clients = db.getAllClients();
    
    const enrichedInvoices = invoices.map(invoice => {
      const client = clients.find(c => c.id === invoice.client_id) || {};
      const total = invoice.items.reduce((sum, item) => {
        const subtotal = (item.quantity || 1) * (item.unit_price || 0);
        const iva = subtotal * ((item.iva_rate || 0) / 100);
        return sum + subtotal + iva;
      }, 0);
      
      return {
        ...invoice,
        client_name: client.name || 'Cliente desconocido',
        total: Math.round(total * 100) / 100
      };
    });
    
    res.json({ invoices: enrichedInvoices });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error interno al obtener facturas' });
  }
});

// Obtener una factura por ID
router.get('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.getInvoiceById(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    const clients = db.getAllClients();
    const client = clients.find(c => c.id === invoice.client_id) || {};
    
    const total = invoice.items.reduce((sum, item) => {
      const subtotal = (item.quantity || 1) * (item.unit_price || 0);
      const iva = subtotal * ((item.iva_rate || 0) / 100);
      return sum + subtotal + iva;
    }, 0);
    
    res.json({
      invoice: {
        ...invoice,
        client_name: client.name || 'Cliente desconocido',
        total: Math.round(total * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error interno al obtener factura' });
  }
});

// Crear nueva factura
router.post('/', verifyToken, (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      client_id: parseInt(req.body.client_id),
      items: req.body.items.map(item => ({
        service_id: parseInt(item.service_id),
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        iva_rate: parseFloat(item.iva_rate) || 21
      }))
    };
    
    const newInvoice = db.createInvoice(invoiceData);
    res.status(201).json({ invoice: newInvoice });
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error interno al crear factura' });
  }
});

// Actualizar factura completa
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const invoiceData = {
      ...req.body,
      client_id: parseInt(req.body.client_id),
      items: req.body.items.map(item => ({
        service_id: parseInt(item.service_id),
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        iva_rate: parseFloat(item.iva_rate) || 21
      }))
    };
    
    const updated = db.updateInvoice(id, invoiceData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    res.json({ message: 'Factura actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ error: 'Error interno al actualizar factura' });
  }
});

// Actualizar estado de factura - CORREGIDO
router.patch('/:id/status', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Actualizando estado de factura:', { id, status });
    
    const validStates = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStates.includes(status)) {
      return res.status(400).json({ 
        error: \`Estado inválido. Debe ser uno de: \${validStates.join(', ')}\`
      });
    }

    const data = db.readData();
    const index = data.invoices.findIndex(invoice => invoice.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    data.invoices[index].status = status;
    db.writeData(data);
    
    console.log('Estado actualizado exitosamente');
    return res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return res.status(500).json({ error: 'Error interno al actualizar estado' });
  }
});

// Eliminar factura
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteInvoice(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    res.json({ message: 'Factura eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ error: 'Error interno al eliminar factura' });
  }
});

module.exports = router;
`;

// Escribir el archivo de rutas corregido
fs.writeFileSync(path.join(__dirname, 'backend/routes/invoices.js'), backendRouteContent);
console.log('✅ Rutas de facturas corregidas');

// 3. Crear dashboard corregido
const dashboardContent = `const express = require('express');
const db = require('../config/jsondb');
const authRouter = require('./auth');
const verifyToken = authRouter.verifyToken;

const router = express.Router();

// Dashboard principal con estadísticas CORREGIDAS
router.get('/', verifyToken, (req, res) => {
  try {
    const data = db.readData();
    const totalInvoices = data.invoices.length;
    const totalClients = data.clients.length;
    const totalServices = data.services.length;
    
    // Calcular ingresos totales correctamente
    const totalRevenue = data.invoices.reduce((sum, invoice) => {
      const invoiceTotal = invoice.items.reduce((itemSum, item) => {
        const subtotal = (item.quantity || 1) * (item.unit_price || 0);
        const iva = subtotal * ((item.iva_rate || 0) / 100);
        return itemSum + subtotal + iva;
      }, 0);
      return sum + invoiceTotal;
    }, 0);
    
    // Facturas recientes con nombres de clientes
    const recentInvoices = data.invoices.slice(-5).reverse().map(invoice => {
      const client = data.clients.find(c => c.id === invoice.client_id) || {};
      const total = invoice.items.reduce((sum, item) => {
        const subtotal = (item.quantity || 1) * (item.unit_price || 0);
        const iva = subtotal * ((item.iva_rate || 0) / 100);
        return sum + subtotal + iva;
      }, 0);
      
      return {
        ...invoice,
        client_name: client.name || 'Cliente desconocido',
        total: Math.round(total * 100) / 100
      };
    });
    
    res.json({
      totalInvoices,
      totalClients,
      totalServices,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      recentInvoices
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error interno en dashboard' });
  }
});

module.exports = router;
`;

fs.writeFileSync(path.join(__dirname, 'backend/routes/dashboard.js'), dashboardContent);
console.log('✅ Dashboard corregido');

console.log('\n🎉 CORRECCIÓN COMPLETA FINALIZADA');
console.log('📋 Cambios realizados:');
console.log('   - Facturas con IVA corregido (21% por defecto)');
console.log('   - client_id convertido a número');
console.log('   - Cálculo de totales corregido');
console.log('   - Nombres de clientes en facturas');
console.log('   - Cambio de estado de facturas funcional');
console.log('   - Dashboard con datos reales');
console.log('\n🔄 Ahora reinicia Docker con: docker-compose up --build -d');
