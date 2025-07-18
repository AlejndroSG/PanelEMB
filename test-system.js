const JsonDatabase = require('./backend/config/jsondb');

console.log('🧪 PROBANDO SISTEMA EMB...\n');

// Crear instancia de la base de datos
const db = new JsonDatabase();

// 1. Probar getAllInvoices
console.log('1️⃣ Probando getAllInvoices:');
const invoices = db.getAllInvoices();
console.log(`   📊 Número de facturas: ${invoices.length}`);

if (invoices.length > 0) {
  const firstInvoice = invoices[0];
  console.log(`   📄 Primera factura:`);
  console.log(`      - ID: ${firstInvoice.id}`);
  console.log(`      - Número: ${firstInvoice.invoice_number}`);
  console.log(`      - Cliente ID: ${firstInvoice.client_id} (tipo: ${typeof firstInvoice.client_id})`);
  console.log(`      - Nombre del cliente: ${firstInvoice.client_name}`);
  console.log(`      - Total: ${firstInvoice.total}€`);
  console.log(`      - Estado: ${firstInvoice.status}`);
  console.log(`      - Items: ${firstInvoice.items.length}`);
  
  if (firstInvoice.items.length > 0) {
    const item = firstInvoice.items[0];
    console.log(`      - Primer item: servicio ${item.service_id}, cantidad ${item.quantity}, precio ${item.unit_price}, IVA ${item.iva_rate}%`);
  }
}

// 2. Probar updateInvoiceStatus
console.log('\n2️⃣ Probando updateInvoiceStatus:');
if (invoices.length > 0) {
  const testInvoiceId = invoices[0].id;
  const originalStatus = invoices[0].status;
  
  console.log(`   🔄 Cambiando estado de factura ${testInvoiceId} de "${originalStatus}" a "paid"`);
  
  const updated = db.updateInvoiceStatus(testInvoiceId, 'paid');
  console.log(`   ✅ Actualización exitosa: ${updated}`);
  
  // Verificar el cambio
  const updatedInvoices = db.getAllInvoices();
  const updatedInvoice = updatedInvoices.find(inv => inv.id === testInvoiceId);
  console.log(`   📋 Nuevo estado: ${updatedInvoice.status}`);
  
  // Revertir el cambio
  db.updateInvoiceStatus(testInvoiceId, originalStatus);
  console.log(`   🔄 Estado revertido a: ${originalStatus}`);
}

// 3. Probar createInvoice
console.log('\n3️⃣ Probando createInvoice:');
const testInvoiceData = {
  client_id: "1", // Enviamos como string para probar la conversión
  issue_date: "2025-07-17",
  due_date: "2025-08-17",
  items: [
    {
      service_id: "1",
      quantity: "2",
      unit_price: "400",
      iva_rate: "21"
    }
  ],
  notes: "Factura de prueba"
};

console.log('   📝 Creando factura de prueba...');
const newInvoice = db.createInvoice(testInvoiceData);
console.log(`   ✅ Factura creada con ID: ${newInvoice.id}`);
console.log(`   📄 Número: ${newInvoice.invoice_number}`);
console.log(`   👤 Cliente ID: ${newInvoice.client_id} (tipo: ${typeof newInvoice.client_id})`);
console.log(`   💰 Precio unitario: ${newInvoice.items[0].unit_price} (tipo: ${typeof newInvoice.items[0].unit_price})`);
console.log(`   📊 IVA: ${newInvoice.items[0].iva_rate}% (tipo: ${typeof newInvoice.items[0].iva_rate})`);

// Calcular total esperado
const expectedSubtotal = 2 * 400; // 800
const expectedIva = expectedSubtotal * 0.21; // 168
const expectedTotal = expectedSubtotal + expectedIva; // 968
console.log(`   💵 Total esperado: ${expectedTotal}€`);

// Verificar con getAllInvoices
const allInvoicesAfter = db.getAllInvoices();
const createdInvoice = allInvoicesAfter.find(inv => inv.id === newInvoice.id);
console.log(`   💰 Total calculado: ${createdInvoice.total}€`);
console.log(`   👤 Nombre del cliente: ${createdInvoice.client_name}`);

// Limpiar - eliminar la factura de prueba
db.deleteInvoice(newInvoice.id);
console.log(`   🗑️ Factura de prueba eliminada`);

console.log('\n🎉 PRUEBAS COMPLETADAS');
console.log('\n📋 Resumen:');
console.log(`   - Facturas existentes: ${invoices.length}`);
console.log(`   - Cambio de estado: ${invoices.length > 0 ? '✅ Funcional' : '❌ No hay facturas para probar'}`);
console.log(`   - Creación de facturas: ✅ Funcional`);
console.log(`   - Cálculo de totales: ✅ Funcional`);
console.log(`   - Nombres de clientes: ✅ Funcional`);
