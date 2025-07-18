const JsonDatabase = require('./backend/config/jsondb');

// Crear instancia de la base de datos
const db = new JsonDatabase();

console.log('=== PROBANDO CORRECCIONES ===\n');

// Probar getAllInvoices
console.log('1. Probando getAllInvoices:');
const invoices = db.getAllInvoices();
console.log('Número de facturas:', invoices.length);
if (invoices.length > 0) {
  console.log('Primera factura:');
  console.log('- ID:', invoices[0].id);
  console.log('- Número:', invoices[0].invoice_number);
  console.log('- Cliente ID:', invoices[0].client_id);
  console.log('- Nombre del cliente:', invoices[0].client_name);
  console.log('- Total:', invoices[0].total);
  console.log('- Items:', invoices[0].items.length);
}

console.log('\n2. Probando getDashboardStats:');
const stats = db.getDashboardStats();
console.log('- Total facturas:', stats.totalInvoices);
console.log('- Total clientes:', stats.totalClients);
console.log('- Total servicios:', stats.totalServices);
console.log('- Total ingresos:', stats.totalRevenue);
console.log('- Facturas recientes:', stats.recentInvoices.length);

if (stats.recentInvoices.length > 0) {
  console.log('\nFactura reciente ejemplo:');
  console.log('- Nombre del cliente:', stats.recentInvoices[0].client_name);
  console.log('- Total:', stats.recentInvoices[0].total);
}

console.log('\n3. Probando updateInvoiceStatus:');
if (invoices.length > 0) {
  const firstInvoiceId = invoices[0].id;
  console.log('Estado actual de la factura', firstInvoiceId + ':', invoices[0].status);
  
  // Cambiar estado a 'paid'
  const updated = db.updateInvoiceStatus(firstInvoiceId, 'paid');
  console.log('¿Actualización exitosa?', updated);
  
  // Verificar el cambio
  const updatedInvoices = db.getAllInvoices();
  const updatedInvoice = updatedInvoices.find(inv => inv.id === firstInvoiceId);
  console.log('Nuevo estado:', updatedInvoice.status);
  
  // Revertir el cambio
  db.updateInvoiceStatus(firstInvoiceId, 'pending');
  console.log('Estado revertido a: pending');
}

console.log('\n=== PRUEBAS COMPLETADAS ===');
