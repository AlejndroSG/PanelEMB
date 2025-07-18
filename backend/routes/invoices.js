const express = require('express');
const db = require('../config/jsondb');
const authRouter = require('./auth');
const verifyToken = authRouter.verifyToken;
const { jsPDF } = require('jspdf');
const path = require('path');
const fs = require('fs');

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

// Obtener todas las facturas con nombres de clientes y totales calculados
router.get('/', verifyToken, (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    const clients = db.getAllClients();
    
    const enrichedInvoices = invoices.map(invoice => {
      const client = clients.find(c => c.id === invoice.client_id) || {};
      const total = calculateInvoiceTotal(invoice);
      
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
    const total = calculateInvoiceTotal(invoice);
    
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

// Actualizar estado de factura - FUNCIONAL
router.patch('/:id/status', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('🔄 Actualizando estado de factura:', { id, status });
    
    const validStates = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStates.includes(status)) {
      console.log('❌ Estado inválido:', status);
      return res.status(400).json({ 
        error: `Estado inválido. Debe ser uno de: ${validStates.join(', ')}`
      });
    }

    const data = db.readData();
    const index = data.invoices.findIndex(invoice => invoice.id === parseInt(id));
    
    if (index === -1) {
      console.log('❌ Factura no encontrada:', id);
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    data.invoices[index].status = status;
    db.writeData(data);
    
    console.log('✅ Estado actualizado exitosamente');
    return res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
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

// Función para generar PDF de factura
function generateInvoicePDF(invoice, client, services) {
  const doc = new jsPDF();
  
  // Configuración de colores EMB más profesionales
  const embBlue = [41, 128, 185];
  const lightBlue = [174, 213, 239];
  const darkGray = [52, 73, 94];
  const lightGray = [236, 240, 241];
  const white = [255, 255, 255];
  
  // Header profesional con gradiente visual
  doc.setFillColor(...embBlue);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo y nombre de la empresa
  doc.setTextColor(...white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB', 20, 30);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Desarrollo Web & Marketing Digital', 20, 40);
  
  // Información de contacto de la empresa
  doc.setFontSize(10);
  doc.text('info@emb.es | +34 123 456 789 | www.emb.es', 20, 47);
  
  // Título FACTURA con fondo
  doc.setFillColor(...white);
  doc.roundedRect(140, 15, 60, 20, 3, 3, 'F');
  doc.setTextColor(...embBlue);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', 150, 28);
  
  // Número de factura
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº ${invoice.invoice_number}`, 150, 35);
  
  // Línea separadora
  doc.setDrawColor(...embBlue);
  doc.setLineWidth(1);
  doc.line(20, 55, 190, 55);
  
  // Sección de información del cliente con fondo
  doc.setFillColor(...lightGray);
  doc.roundedRect(15, 65, 85, 40, 3, 3, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURAR A:', 20, 75);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let yPos = 82;
  doc.text(client.name || 'Cliente', 20, yPos);
  if (client.email) {
    yPos += 6;
    doc.text(`📧 ${client.email}`, 20, yPos);
  }
  if (client.phone) {
    yPos += 6;
    doc.text(`📞 ${client.phone}`, 20, yPos);
  }
  if (client.address) {
    yPos += 6;
    doc.text(`📍 ${client.address}`, 20, yPos);
  }
  
  // Sección de fechas con fondo
  doc.setFillColor(...lightGray);
  doc.roundedRect(110, 65, 80, 40, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE FACTURA:', 115, 75);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha de emisión:', 115, 85);
  doc.text(new Date(invoice.issue_date).toLocaleDateString('es-ES'), 160, 85);
  
  doc.text('Fecha de vencimiento:', 115, 92);
  doc.text(new Date(invoice.due_date).toLocaleDateString('es-ES'), 160, 92);
  
  // Estado de la factura
  doc.text('Estado:', 115, 99);
  const statusText = {
    pending: 'Pendiente',
    paid: 'Pagada',
    overdue: 'Vencida',
    cancelled: 'Cancelada'
  };
  doc.setFont('helvetica', 'bold');
  doc.text(statusText[invoice.status] || 'Pendiente', 140, 99);
  
  // Tabla de items con diseño profesional
  let yPosition = 115;
  
  // Título de la tabla
  doc.setTextColor(...darkGray);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE SERVICIOS', 20, yPosition);
  
  yPosition += 10;
  
  // Headers de la tabla con mejor diseño
  doc.setFillColor(...embBlue);
  doc.rect(15, yPosition, 180, 12, 'F');
  
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESCRIPCIÓN', 20, yPosition + 8);
  doc.text('CANT.', 110, yPosition + 8);
  doc.text('PRECIO', 130, yPosition + 8);
  doc.text('IVA', 150, yPosition + 8);
  doc.text('TOTAL', 170, yPosition + 8);
  
  yPosition += 15;
  
  // Items con alternancia de colores
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let subtotal = 0;
  let totalIVA = 0;
  let rowIndex = 0;
  
  invoice.items.forEach(item => {
    const service = services.find(s => s.id === item.service_id) || { name: 'Servicio', description: '' };
    const itemSubtotal = item.quantity * item.unit_price;
    const itemIVA = itemSubtotal * (item.iva_rate / 100);
    const itemTotal = itemSubtotal + itemIVA;
    
    // Fila alternada
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...lightGray);
      doc.rect(15, yPosition - 5, 180, 12, 'F');
    }
    
    doc.setTextColor(...darkGray);
    
    // Nombre del servicio
    doc.setFont('helvetica', 'bold');
    doc.text(service.name, 20, yPosition);
    
    // Descripción del servicio (si existe)
    if (service.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(service.description, 20, yPosition + 4);
      doc.setFontSize(9);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.text(item.quantity.toString(), 115, yPosition);
    doc.text(`€${item.unit_price.toFixed(2)}`, 130, yPosition);
    doc.text(`${item.iva_rate}%`, 152, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`€${itemTotal.toFixed(2)}`, 170, yPosition);
    
    subtotal += itemSubtotal;
    totalIVA += itemIVA;
    yPosition += service.description ? 15 : 12;
    rowIndex++;
  });
  
  // Línea separadora antes de totales
  yPosition += 5;
  doc.setDrawColor(...embBlue);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, 195, yPosition);
  
  // Sección de totales con diseño mejorado
  yPosition += 15;
  
  // Fondo para totales
  doc.setFillColor(...lightGray);
  doc.roundedRect(120, yPosition - 5, 75, 35, 3, 3, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', 125, yPosition);
  doc.text(`€${subtotal.toFixed(2)}`, 170, yPosition);
  
  yPosition += 8;
  doc.text('IVA:', 125, yPosition);
  doc.text(`€${totalIVA.toFixed(2)}`, 170, yPosition);
  
  // Línea separadora para total
  yPosition += 5;
  doc.setDrawColor(...embBlue);
  doc.setLineWidth(1);
  doc.line(125, yPosition, 190, yPosition);
  
  yPosition += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...embBlue);
  doc.text('TOTAL:', 125, yPosition);
  doc.text(`€${(subtotal + totalIVA).toFixed(2)}`, 165, yPosition);
  
  // Notas con diseño mejorado
  if (invoice.notes) {
    yPosition += 20;
    
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, yPosition - 5, 180, 25, 3, 3, 'F');
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS ADICIONALES:', 20, yPosition + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoice.notes, 20, yPosition + 15);
    
    yPosition += 30;
  }
  
  // Footer profesional
  const footerY = 270;
  
  // Línea separadora del footer
  doc.setDrawColor(...embBlue);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 10, 190, footerY - 10);
  
  // Información de la empresa en el footer
  doc.setFillColor(...embBlue);
  doc.rect(0, footerY, 210, 27, 'F');
  
  doc.setTextColor(...white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB - Desarrollo Web & Marketing Digital', 20, footerY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('CIF: B12345678 | Registro Mercantil: Madrid, Tomo 1234, Folio 567, Sección 8, Hoja M-12345', 20, footerY + 15);
  doc.text('Dirección: Calle Ejemplo 123, 28001 Madrid | Tel: +34 123 456 789 | Email: info@emb.es', 20, footerY + 20);
  
  // Mensaje de agradecimiento
  doc.setTextColor(...white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('¡Gracias por confiar en EMB para sus proyectos digitales!', 140, footerY + 8);
  
  return doc;
}

// Generar y descargar PDF de factura
router.get('/:id/pdf', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.getInvoiceById(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    const client = db.getClientById(invoice.client_id) || {};
    const services = db.getAllServices();
    
    const doc = generateInvoicePDF(invoice, client, services);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.invoice_number}.pdf"`);
    
    // Enviar PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error interno al generar PDF' });
  }
});

// Ver factura (devuelve datos completos para modal)
router.get('/:id/view', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.getInvoiceById(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    const client = db.getClientById(invoice.client_id) || {};
    const services = db.getAllServices();
    
    // Enriquecer items con información de servicios
    const enrichedItems = invoice.items.map(item => {
      const service = services.find(s => s.id === item.service_id) || {};
      return {
        ...item,
        service_name: service.name || 'Servicio desconocido',
        service_description: service.description || ''
      };
    });
    
    const enrichedInvoice = {
      ...invoice,
      client_name: client.name || 'Cliente desconocido',
      client_email: client.email || '',
      client_phone: client.phone || '',
      client_address: client.address || '',
      items: enrichedItems,
      total: calculateInvoiceTotal(invoice)
    };
    
    res.json({ invoice: enrichedInvoice });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error interno al obtener factura' });
  }
});

module.exports = router;
