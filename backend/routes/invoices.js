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
  const embDark = [23, 54, 93];
  const lightBlue = [174, 213, 239];
  const darkGray = [52, 73, 94];
  const lightGray = [248, 249, 250];
  const white = [255, 255, 255];
  const accent = [46, 204, 113];
  
  // Header profesional con gradiente mejorado
  doc.setFillColor(...embDark);
  doc.rect(0, 0, 210, 55, 'F');
  
  // Banda decorativa superior
  doc.setFillColor(...accent);
  doc.rect(0, 0, 210, 3, 'F');
  
  // Logo EMB mejorado con diseño
  doc.setFillColor(...white);
  doc.roundedRect(15, 12, 50, 30, 5, 5, 'F');
  
  // Logo text con mejor tipografía
  doc.setTextColor(...embBlue);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB', 25, 32);
  
  // Información de la empresa con mejor layout
  doc.setTextColor(...white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB DIGITAL SOLUTIONS', 75, 25);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Desarrollo Web • Marketing Digital • Consultoría IT', 75, 33);
  
  // Información de contacto mejorada
  doc.setFontSize(9);
  doc.text('📧 info@emb.es  📞 +34 123 456 789  🌐 www.emb.es', 75, 42);
  doc.text('📍 Calle Innovación 123, 28001 Madrid, España', 75, 48);
  
  // Título FACTURA mejorado
  doc.setFillColor(...accent);
  doc.roundedRect(135, 15, 70, 25, 5, 5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', 148, 30);
  
  // Número de factura con mejor diseño
  doc.setFillColor(...white);
  doc.roundedRect(135, 42, 70, 10, 3, 3, 'F');
  doc.setTextColor(...embDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº ${invoice.invoice_number}`, 148, 48);
  
  // Línea separadora decorativa
  doc.setDrawColor(...accent);
  doc.setLineWidth(2);
  doc.line(15, 60, 195, 60);
  
  // Línea secundaria
  doc.setDrawColor(...lightBlue);
  doc.setLineWidth(0.5);
  doc.line(15, 62, 195, 62);
  
  // Sección de información del cliente mejorada
  doc.setFillColor(...lightGray);
  doc.roundedRect(15, 70, 85, 45, 5, 5, 'F');
  
  // Header del cliente con icono
  doc.setFillColor(...embBlue);
  doc.roundedRect(15, 70, 85, 12, 5, 5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('👤 FACTURAR A:', 20, 78);
  
  // Información del cliente
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  let yPos = 88;
  doc.text(client.name || 'Cliente', 20, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
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
  if (client.cif_nif) {
    yPos += 6;
    doc.text(`🏢 CIF/NIF: ${client.cif_nif}`, 20, yPos);
  }
  
  // Sección de fechas mejorada
  doc.setFillColor(...lightGray);
  doc.roundedRect(110, 70, 85, 45, 5, 5, 'F');
  
  // Header de detalles con icono
  doc.setFillColor(...embBlue);
  doc.roundedRect(110, 70, 85, 12, 5, 5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 DETALLES DE FACTURA:', 115, 78);
  
  // Información de fechas con mejor diseño
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Fecha de emisión
  doc.text('Fecha de emisión:', 115, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(invoice.issue_date).toLocaleDateString('es-ES'), 165, 90);
  
  // Fecha de vencimiento
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha de vencimiento:', 115, 97);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(invoice.due_date).toLocaleDateString('es-ES'), 165, 97);
  
  // Estado de la factura con badge
  doc.setFont('helvetica', 'normal');
  doc.text('Estado:', 115, 104);
  
  const statusText = {
    pending: 'PENDIENTE',
    paid: 'PAGADA',
    overdue: 'VENCIDA',
    cancelled: 'CANCELADA'
  };
  
  const statusColors = {
    pending: [255, 193, 7],
    paid: [40, 167, 69],
    overdue: [220, 53, 69],
    cancelled: [108, 117, 125]
  };
  
  const statusColor = statusColors[invoice.status] || statusColors.pending;
  doc.setFillColor(...statusColor);
  doc.roundedRect(155, 100, 35, 8, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText[invoice.status] || 'PENDIENTE', 158, 105);
  
  // Tabla de items con diseño profesional mejorado
  let yPosition = 125;
  
  // Título de la tabla con icono
  doc.setFillColor(...embDark);
  doc.roundedRect(15, yPosition, 180, 15, 3, 3, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 DETALLE DE SERVICIOS', 20, yPosition + 10);
  
  yPosition += 20;
  
  // Headers de la tabla con mejor diseño
  doc.setFillColor(...accent);
  doc.roundedRect(15, yPosition, 180, 12, 2, 2, 'F');
  
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPCIÓN', 20, yPosition + 8);
  doc.text('CANT.', 115, yPosition + 8);
  doc.text('PRECIO', 135, yPosition + 8);
  doc.text('IVA', 155, yPosition + 8);
  doc.text('TOTAL', 175, yPosition + 8);
  
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
  
  // Footer profesional mejorado
  const footerY = 265;
  
  // Sección de información adicional
  doc.setFillColor(...lightGray);
  doc.roundedRect(15, footerY - 25, 180, 20, 3, 3, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDICIONES DE PAGO:', 20, footerY - 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Pago a 30 días desde la fecha de emisión. Transferencia bancaria o domiciliación SEPA.', 20, footerY - 12);
  doc.text('Recargos por demora según Ley 3/2004. Retención IRPF aplicable según legislación vigente.', 20, footerY - 7);
  
  // Línea separadora decorativa
  doc.setDrawColor(...accent);
  doc.setLineWidth(2);
  doc.line(15, footerY - 2, 195, footerY - 2);
  
  // Footer principal con gradiente
  doc.setFillColor(...embDark);
  doc.rect(0, footerY, 210, 32, 'F');
  
  // Banda decorativa inferior
  doc.setFillColor(...accent);
  doc.rect(0, footerY + 29, 210, 3, 'F');
  
  // Logo en el footer
  doc.setFillColor(...white);
  doc.roundedRect(15, footerY + 5, 30, 20, 3, 3, 'F');
  doc.setTextColor(...embBlue);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB', 22, footerY + 17);
  
  // Información de la empresa
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB DIGITAL SOLUTIONS', 55, footerY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('CIF: B12345678 • Registro Mercantil de Madrid', 55, footerY + 16);
  doc.text('Calle Innovación 123, 28001 Madrid, España', 55, footerY + 20);
  doc.text('📞 +34 123 456 789 • 📧 info@emb.es • 🌐 www.emb.es', 55, footerY + 24);
  
  // Mensaje de agradecimiento mejorado
  doc.setFillColor(...accent);
  doc.roundedRect(140, footerY + 8, 60, 12, 3, 3, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('¡Gracias por su confianza!', 145, footerY + 16);
  
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
