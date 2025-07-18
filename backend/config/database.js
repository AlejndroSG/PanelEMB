const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/emb_billing.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
      } else {
        console.log('✅ Conectado a la base de datos SQLite');
      }
    });
  }

  init() {
    this.createTables();
    this.insertDefaultData();
  }

  createTables() {
    // Tabla de usuarios (los 4 autónomos)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de clientes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        cif_nif TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de servicios
    this.db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        iva_rate REAL DEFAULT 21.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de facturas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        client_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE,
        subtotal REAL NOT NULL,
        iva_amount REAL NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Tabla de items de factura
    this.db.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id),
        FOREIGN KEY (service_id) REFERENCES services (id)
      )
    `);

    console.log('✅ Tablas de base de datos creadas');
  }

  insertDefaultData() {
    // Insertar usuarios por defecto (los 4 autónomos)
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('emb2025', 10);

    const users = [
      { name: 'Aguayo', email: 'aguayo@emb.com', password: defaultPassword },
      { name: 'Pepe', email: 'pepe@emb.com', password: defaultPassword },
      { name: 'Andrés', email: 'andres@emb.com', password: defaultPassword },
      { name: 'Alex', email: 'alex@emb.com', password: defaultPassword }
    ];

    users.forEach(user => {
      this.db.run(
        'INSERT OR IGNORE INTO users (name, email, password) VALUES (?, ?, ?)',
        [user.name, user.email, user.password]
      );
    });

    // Insertar servicios por defecto
    const services = [
      { name: 'Desarrollo Web', description: 'Desarrollo de páginas web y aplicaciones', price: 1500.00, iva_rate: 21.0 },
      { name: 'Marketing Digital', description: 'Estrategias de marketing online', price: 800.00, iva_rate: 21.0 },
      { name: 'Posicionamiento SEO', description: 'Optimización para motores de búsqueda', price: 600.00, iva_rate: 21.0 },
      { name: 'Hosting', description: 'Alojamiento web y dominio', price: 120.00, iva_rate: 21.0 },
      { name: 'Mantenimiento', description: 'Mantenimiento y soporte técnico', price: 300.00, iva_rate: 21.0 }
    ];

    services.forEach(service => {
      this.db.run(
        'INSERT OR IGNORE INTO services (name, description, price, iva_rate) VALUES (?, ?, ?, ?)',
        [service.name, service.description, service.price, service.iva_rate]
      );
    });

    console.log('✅ Datos por defecto insertados');
  }

  getDB() {
    return this.db;
  }
}

module.exports = new Database();
