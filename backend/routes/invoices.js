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

// Función para generar PDF de factura con diseño profesional
function generateInvoicePDF(invoice, client, services) {
  const doc = new jsPDF();
  
  // Paleta de colores profesional EMB
  const embDark = [15, 23, 42];        // slate-900
  const embBlue = [30, 64, 175];       // blue-800
  const embAccent = [16, 185, 129];    // emerald-500
  const embGray = [71, 85, 105];       // slate-600
  const lightGray = [248, 250, 252];   // slate-50
  const mediumGray = [203, 213, 225];  // slate-300
  const white = [255, 255, 255];
  const success = [34, 197, 94];       // green-500
  const warning = [251, 191, 36];      // amber-400
  const danger = [239, 68, 68];        // red-500
  
  // === HEADER PROFESIONAL ===
  // Fondo principal del header
  doc.setFillColor(...embDark);
  doc.rect(0, 0, 210, 60, 'F');
  
  // Banda decorativa superior
  doc.setFillColor(...embAccent);
  doc.rect(0, 0, 210, 8, 'F');
  
  // Logo EMB mejorado
  doc.setTextColor(...white);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB', 20, 35);
  
  // Subtítulo de la empresa
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('BILLING SYSTEM', 20, 45);
  
  // Información de la empresa
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text('Email: info@embdevs.com', 20, 52);
  doc.text('Tel: +34 123 456 789', 80, 52);
  doc.text('Web: www.embdevs.com', 140, 52);
  
  // Badge de FACTURA
  doc.setFillColor(...embAccent);
  doc.roundedRect(135, 18, 65, 25, 5, 5, 'F');
  
  // Texto FACTURA
  doc.setTextColor(...white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', 145, 32);
  
  // Número de factura en caja blanca
  doc.setFillColor(...white);
  doc.roundedRect(140, 35, 55, 8, 2, 2, 'F');
  doc.setTextColor(...embDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº ${invoice.invoice_number}`, 145, 40);
  
  // Línea separadora elegante
  doc.setDrawColor(...embAccent);
  doc.setLineWidth(2);
  doc.line(20, 65, 190, 65);
  
  // === SECCIÓN DE INFORMACIÓN ===
  
  // Información del Cliente
  doc.setFillColor(...white);
  doc.roundedRect(15, 75, 85, 45, 5, 5, 'F');
  doc.setDrawColor(...mediumGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 75, 85, 45, 5, 5, 'S');
  
  // Header de cliente con icono
  doc.setFillColor(...embBlue);
  doc.roundedRect(15, 75, 85, 12, 5, 5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 20, 83);
  
  // Datos del cliente
  doc.setTextColor(...embDark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  let yPos = 95;
  doc.text(client.name || 'Cliente', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (client.email) {
    yPos += 6;
    doc.text(`Email: ${client.email}`, 20, yPos);
  }
  if (client.phone) {
    yPos += 6;
    doc.text(`Tel: ${client.phone}`, 20, yPos);
  }
  if (client.address) {
    yPos += 6;
    doc.text(`Dirección: ${client.address}`, 20, yPos);
  }
  
  // Detalles de la Factura
  doc.setFillColor(...white);
  doc.roundedRect(110, 75, 80, 45, 5, 5, 'F');
  doc.setDrawColor(...mediumGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(110, 75, 80, 45, 5, 5, 'S');
  
  // Header de detalles con icono
  doc.setFillColor(...embBlue);
  doc.roundedRect(110, 75, 80, 12, 5, 5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES', 115, 83);
  
  // Fechas y estado
  doc.setTextColor(...embDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Fecha de emisión:', 115, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(invoice.issue_date).toLocaleDateString('es-ES'), 160, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha de vencimiento:', 115, 103);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(invoice.due_date).toLocaleDateString('es-ES'), 160, 103);
  
  // Estado de la factura con badge colorido
  doc.setFont('helvetica', 'normal');
  doc.text('Estado:', 115, 111);
  
  const statusConfig = {
    pending: { text: 'Pendiente', color: warning, bgColor: [255, 251, 235] },
    paid: { text: 'Pagada', color: success, bgColor: [240, 253, 244] },
    overdue: { text: 'Vencida', color: danger, bgColor: [254, 242, 242] },
    cancelled: { text: 'Cancelada', color: embGray, bgColor: [248, 250, 252] }
  };
  
  const status = statusConfig[invoice.status] || statusConfig.pending;
  
  // Badge del estado
  doc.setFillColor(...status.bgColor);
  doc.roundedRect(155, 107, 30, 8, 2, 2, 'F');
  doc.setTextColor(...status.color);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(status.text, 158, 112);
  
  // === TABLA DE SERVICIOS ===
  let yPosition = 135;
  
  // Título de la sección con icono
  doc.setFillColor(...embDark);
  doc.roundedRect(15, yPosition, 180, 15, 3, 3, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE SERVICIOS', 20, yPosition + 10);
  
  yPosition += 20;
  
  // Headers de la tabla profesional
  doc.setFillColor(...embBlue);
  doc.roundedRect(15, yPosition, 180, 15, 3, 3, 'F');
  
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESCRIPCIÓN', 20, yPosition + 10);
  doc.text('CANT.', 105, yPosition + 10);
  doc.text('PRECIO UNIT.', 125, yPosition + 10);
  doc.text('IVA', 155, yPosition + 10);
  doc.text('TOTAL', 175, yPosition + 10);
  
  yPosition += 18;
  
  // Items con diseño profesional
  let subtotal = 0;
  let totalIVA = 0;
  let rowIndex = 0;
  
  invoice.items.forEach(item => {
    const service = services.find(s => s.id === item.service_id) || { name: 'Servicio', description: '' };
    const itemSubtotal = item.quantity * item.unit_price;
    const itemIVA = itemSubtotal * (item.iva_rate / 100);
    const itemTotal = itemSubtotal + itemIVA;
    
    // Fila con bordes redondeados
    const rowHeight = service.description ? 18 : 12;
    
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...lightGray);
    } else {
      doc.setFillColor(...white);
    }
    doc.roundedRect(15, yPosition - 3, 180, rowHeight, 2, 2, 'F');
    
    // Borde sutil
    doc.setDrawColor(...mediumGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, yPosition - 3, 180, rowHeight, 2, 2, 'S');
    
    doc.setTextColor(...embDark);
    
    // Nombre del servicio
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(service.name, 20, yPosition + 3);
    
    // Descripción del servicio (si existe)
    if (service.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...embGray);
      doc.text(service.description, 20, yPosition + 8);
    }
    
    // Datos numéricos
    doc.setTextColor(...embDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(item.quantity.toString(), 108, yPosition + 3);
    doc.text(`€${item.unit_price.toFixed(2)}`, 127, yPosition + 3);
    doc.text(`${item.iva_rate}%`, 157, yPosition + 3);
    
    // Total en negrita
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...embBlue);
    doc.text(`€${itemTotal.toFixed(2)}`, 175, yPosition + 3);
    
    subtotal += itemSubtotal;
    totalIVA += itemIVA;
    yPosition += rowHeight + 3;
    rowIndex++;
  });
  
  // === SECCIÓN DE TOTALES ===
  yPosition += 10;
  
  // Resumen de precios profesional
  const totalFinal = subtotal + totalIVA;
  
  // Caja de totales con diseño elegante
  doc.setFillColor(...white);
  doc.roundedRect(115, yPosition, 80, 45, 5, 5, 'F');
  doc.setDrawColor(...mediumGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(115, yPosition, 80, 45, 5, 5, 'S');
  
  // Header de totales
  doc.setFillColor(...embDark);
  doc.roundedRect(115, yPosition, 80, 12, 5, 5, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE PRECIOS', 120, yPosition + 8);
  
  // Subtotal
  doc.setTextColor(...embDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 120, yPosition + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`€${subtotal.toFixed(2)}`, 170, yPosition + 20);
  
  // IVA
  doc.setFont('helvetica', 'normal');
  doc.text('IVA:', 120, yPosition + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(`€${totalIVA.toFixed(2)}`, 170, yPosition + 28);
  
  // Línea separadora elegante
  doc.setDrawColor(...embAccent);
  doc.setLineWidth(1);
  doc.line(120, yPosition + 32, 190, yPosition + 32);
  
  // Total final destacado
  doc.setFillColor(...embAccent);
  doc.roundedRect(120, yPosition + 35, 70, 8, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 125, yPosition + 40);
  doc.setFontSize(14);
  doc.text(`€${totalFinal.toFixed(2)}`, 165, yPosition + 40);
  
  yPosition += 50;
  
  // === NOTAS ADICIONALES ===
  if (invoice.notes) {
    yPosition += 15;
    
    doc.setFillColor(...white);
    doc.roundedRect(15, yPosition, 180, 30, 5, 5, 'F');
    doc.setDrawColor(...mediumGray);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPosition, 180, 30, 5, 5, 'S');
    
    // Header de notas
    doc.setFillColor(...embGray);
    doc.roundedRect(15, yPosition, 180, 10, 5, 5, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS ADICIONALES', 20, yPosition + 7);
    
    // Contenido de las notas
    doc.setTextColor(...embDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoice.notes, 20, yPosition + 18);
    
    yPosition += 35;
  }
  
  // === CONDICIONES DE PAGO ===
  yPosition += 10;
  
  doc.setFillColor(...lightGray);
  doc.roundedRect(15, yPosition, 180, 25, 5, 5, 'F');
  
  doc.setTextColor(...embDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDICIONES DE PAGO', 20, yPosition + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('\u2022 El pago debe realizarse en un plazo máximo de 30 días desde la fecha de emisión.', 20, yPosition + 15);
  doc.text('\u2022 Los pagos fuera de plazo estarán sujetos a intereses de demora.', 20, yPosition + 20);
  
  // === FOOTER PROFESIONAL ===
  const footerY = 260;
  
  // Fondo del footer
  doc.setFillColor(...embDark);
  doc.rect(0, footerY, 210, 37, 'F');
  
  // Banda decorativa inferior
  doc.setFillColor(...embAccent);
  doc.rect(0, footerY + 29, 210, 8, 'F');
  
  // Logo en el footer
  doc.setTextColor(...white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EMB', 20, footerY + 18);
  
  // Información de la empresa
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text('EMB Billing System - Desarrollo Web & Marketing Digital', 20, footerY + 25);
  
  // Información legal y fiscal
  doc.setFontSize(7);
  doc.text('CIF: B12345678 | Registro Mercantil de Madrid, Tomo 1234, Folio 567, Sección 8ª, Hoja M-12345', 60, footerY + 8);
  doc.text('Dirección: Calle de la Innovación 123, 28001 Madrid, España', 60, footerY + 14);
  doc.text('Teléfono: +34 123 456 789 | Email: info@embdevs.com | Web: www.embdevs.com', 60, footerY + 20);
  
  // Mensaje de agradecimiento en badge
  doc.setFillColor(...embAccent);
  doc.roundedRect(140, footerY + 23, 55, 8, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('¡Gracias por confiar en EMB!', 145, footerY + 28);
  
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
