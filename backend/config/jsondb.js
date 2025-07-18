const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/data.json');

class JsonDatabase {
  constructor() {
    this.dataFile = path.join(__dirname, '../database/data.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    
    if (!fs.existsSync(dbPath)) {
      const initialData = {
        users: [],
        clients: [],
        services: [],
        invoices: []
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    }
  }

  // Helper para calcular el total de una factura
  calculateInvoiceTotal(invoice) {
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

  readData() {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return { users: [], clients: [], services: [], invoices: [] };
    }
  }

  writeData(data) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing database:', error);
    }
  }

  async init() {
    console.log('🗄️ Inicializando base de datos JSON...');
    
    const data = this.readData();
    
    // Insert default users if empty
    if (data.users.length === 0) {
      const defaultUsers = [
        { id: 1, name: 'Aguayo', email: 'aguayo@emb.com', password: await bcrypt.hash('emb2025', 10), role: 'admin' },
        { id: 2, name: 'Pepe', email: 'pepe@emb.com', password: await bcrypt.hash('emb2025', 10), role: 'user' },
        { id: 3, name: 'Andrés', email: 'andres@emb.com', password: await bcrypt.hash('emb2025', 10), role: 'user' },
        { id: 4, name: 'Alex', email: 'alex@emb.com', password: await bcrypt.hash('emb2025', 10), role: 'user' }
      ];
      data.users = defaultUsers;
    }

    // Insert default services if empty
    if (data.services.length === 0) {
      const defaultServices = [
        { id: 1, name: 'Desarrollo Web', description: 'Desarrollo de sitios web personalizados', price: 800.00, created_at: new Date().toISOString() },
        { id: 2, name: 'Marketing Digital', description: 'Estrategias de marketing online', price: 500.00, created_at: new Date().toISOString() },
        { id: 3, name: 'Posicionamiento SEO', description: 'Optimización para motores de búsqueda', price: 300.00, created_at: new Date().toISOString() },
        { id: 4, name: 'Hosting', description: 'Alojamiento web profesional', price: 50.00, created_at: new Date().toISOString() },
        { id: 5, name: 'Mantenimiento', description: 'Mantenimiento y actualizaciones', price: 100.00, created_at: new Date().toISOString() }
      ];
      data.services = defaultServices;
    }

    this.writeData(data);
    console.log('✅ Base de datos JSON inicializada correctamente');
  }

  // User methods
  getUserByEmail(email) {
    const data = this.readData();
    return data.users.find(user => user.email === email);
  }

  getUserById(id) {
    const data = this.readData();
    return data.users.find(user => user.id === parseInt(id));
  }

  // Client methods
  getAllClients() {
    const data = this.readData();
    return data.clients;
  }

  getClientById(id) {
    const data = this.readData();
    return data.clients.find(client => client.id === parseInt(id));
  }

  createClient(clientData) {
    const data = this.readData();
    const newId = data.clients.length > 0 ? Math.max(...data.clients.map(c => c.id)) + 1 : 1;
    const newClient = {
      id: newId,
      ...clientData,
      created_at: new Date().toISOString()
    };
    data.clients.push(newClient);
    this.writeData(data);
    return newClient;
  }

  updateClient(id, clientData) {
    const data = this.readData();
    const index = data.clients.findIndex(client => client.id === parseInt(id));
    if (index !== -1) {
      data.clients[index] = { ...data.clients[index], ...clientData };
      this.writeData(data);
      return data.clients[index];
    }
    return null;
  }

  deleteClient(id) {
    const data = this.readData();
    const index = data.clients.findIndex(client => client.id === parseInt(id));
    if (index !== -1) {
      data.clients.splice(index, 1);
      this.writeData(data);
      return true;
    }
    return false;
  }

  // Service methods
  getAllServices() {
    const data = this.readData();
    return data.services;
  }

  getServiceById(id) {
    const data = this.readData();
    return data.services.find(service => service.id === parseInt(id));
  }

  createService(serviceData) {
    const data = this.readData();
    const newId = data.services.length > 0 ? Math.max(...data.services.map(s => s.id)) + 1 : 6;
    const newService = {
      id: newId,
      ...serviceData,
      created_at: new Date().toISOString()
    };
    data.services.push(newService);
    this.writeData(data);
    return newService;
  }

  updateService(id, serviceData) {
    const data = this.readData();
    const index = data.services.findIndex(service => service.id === parseInt(id));
    if (index !== -1) {
      data.services[index] = { ...data.services[index], ...serviceData };
      this.writeData(data);
      return data.services[index];
    }
    return null;
  }

  deleteService(id) {
    const data = this.readData();
    const index = data.services.findIndex(service => service.id === parseInt(id));
    if (index !== -1) {
      data.services.splice(index, 1);
      this.writeData(data);
      return true;
    }
    return false;
  }

  // Invoice methods
  getAllInvoices() {
    const data = this.readData();
    // Añadir nombres de clientes y calcular totales
    return data.invoices.map(invoice => {
      const clientId = typeof invoice.client_id === 'string' ? parseInt(invoice.client_id) : invoice.client_id;
      const client = data.clients.find(client => client.id === clientId) || {};
      
      return {
        ...invoice,
        client_name: client.name || 'Cliente no encontrado',
        total: this.calculateInvoiceTotal(invoice)
      };
    });
  }

  getInvoiceById(id) {
    const data = this.readData();
    return data.invoices.find(invoice => invoice.id === parseInt(id));
  }

  createInvoice(invoiceData) {
    const data = this.readData();
    const newId = data.invoices.length > 0 ? Math.max(...data.invoices.map(i => i.id)) + 1 : 1;
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `EMB-${currentYear}-${String(newId).padStart(6, '0')}`;
    
    const newInvoice = {
      id: newId,
      invoice_number: invoiceNumber,
      client_id: parseInt(invoiceData.client_id), // Asegurar que sea número
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      items: invoiceData.items.map(item => ({
        service_id: parseInt(item.service_id),
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        iva_rate: parseFloat(item.iva_rate) || 21
      })),
      status: invoiceData.status || 'pending',
      notes: invoiceData.notes || '',
      created_at: new Date().toISOString()
    };
    
    data.invoices.push(newInvoice);
    this.writeData(data);
    return newInvoice;
  }

  updateInvoice(id, invoiceData) {
    const data = this.readData();
    const index = data.invoices.findIndex(invoice => invoice.id === parseInt(id));
    if (index !== -1) {
      data.invoices[index] = { ...data.invoices[index], ...invoiceData };
      this.writeData(data);
      return data.invoices[index];
    }
    return null;
  }

  deleteInvoice(id) {
    const data = this.readData();
    const index = data.invoices.findIndex(invoice => invoice.id === parseInt(id));
    if (index !== -1) {
      data.invoices.splice(index, 1);
      this.writeData(data);
      return true;
    }
    return false;
  }

  // Método para actualizar solo el estado de una factura
  updateInvoiceStatus(id, status) {
    const data = this.readData();
    const index = data.invoices.findIndex(invoice => invoice.id === parseInt(id));
    if (index !== -1) {
      data.invoices[index].status = status;
      this.writeData(data);
      return true;
    }
    return false;
  }

  // Dashboard methods
  getDashboardStats() {
    const data = this.readData();
    const totalInvoices = data.invoices.length;
    const totalClients = data.clients.length;
    const totalServices = data.services.length;
    
    // Calcular el total de ingresos dinámicamente
    const totalRevenue = data.invoices.reduce((sum, invoice) => {
      return sum + this.calculateInvoiceTotal(invoice);
    }, 0);
    
    // Enriquecer facturas recientes con nombres de clientes
    const recentInvoices = data.invoices.slice(-5).reverse().map(invoice => {
      const clientId = typeof invoice.client_id === 'string' ? parseInt(invoice.client_id) : invoice.client_id;
      const client = data.clients.find(c => c.id === clientId) || {};
      
      return {
        ...invoice,
        client_name: client.name || 'Cliente desconocido',
        total: this.calculateInvoiceTotal(invoice)
      };
    });
    
    return {
      totalInvoices,
      totalClients,
      totalServices,
      totalRevenue,
      recentInvoices
    };
  }
}

module.exports = new JsonDatabase();
