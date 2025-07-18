const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECCIÓN DIRECTA DEL SISTEMA EMB...\n');

// Leer y corregir la base de datos
const dataPath = path.join(__dirname, 'backend/database/data.json');
console.log('📁 Leyendo base de datos...');

try {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log('🔄 Corrigiendo facturas...');
  
  // Corregir facturas existentes
  data.invoices = data.invoices.map(invoice => ({
    ...invoice,
    client_id: parseInt(invoice.client_id), // Asegurar que sea número
    items: invoice.items.map(item => ({
      ...item,
      service_id: parseInt(item.service_id),
      quantity: parseInt(item.quantity) || 1,
      unit_price: parseFloat(item.unit_price) || 0,
      iva_rate: parseFloat(item.iva_rate) || 21
    }))
  }));
  
  // Guardar cambios
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('✅ Base de datos corregida');
  
  // Verificar correcciones
  console.log('\n📊 Verificando datos:');
  console.log(`   - Facturas: ${data.invoices.length}`);
  console.log(`   - Clientes: ${data.clients.length}`);
  
  if (data.invoices.length > 0) {
    const invoice = data.invoices[0];
    console.log(`   - Primera factura:`);
    console.log(`     * ID: ${invoice.id}`);
    console.log(`     * Cliente ID: ${invoice.client_id} (${typeof invoice.client_id})`);
    console.log(`     * Items: ${invoice.items.length}`);
    
    if (invoice.items.length > 0) {
      const item = invoice.items[0];
      console.log(`     * Primer item: ${item.unit_price} (${typeof item.unit_price}) con IVA ${item.iva_rate}%`);
      
      // Calcular total esperado
      const subtotal = item.quantity * item.unit_price;
      const iva = subtotal * (item.iva_rate / 100);
      const total = subtotal + iva;
      console.log(`     * Total esperado: ${total}€`);
    }
  }
  
  if (data.clients.length > 0) {
    console.log(`   - Primer cliente: ${data.clients[0].name}`);
  }
  
  console.log('\n🎉 CORRECCIÓN COMPLETADA');
  console.log('\n📋 Resumen:');
  console.log('   ✅ client_id como número');
  console.log('   ✅ Items con tipos correctos');
  console.log('   ✅ Datos listos para cálculos');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log('\n🚀 Ahora ejecuta: docker-compose restart backend');
