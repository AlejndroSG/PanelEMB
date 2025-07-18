const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configuración mejorada de CORS para Docker
app.use(cors({
  origin: '*',  // Permitir cualquier origen en desarrollo
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de solicitudes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (para PDFs generados)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar rutas
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');
const serviceRoutes = require('./routes/services');
const dashboardRoutes = require('./routes/dashboard');

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend EMB funcionando correctamente!' });
});

// Inicializar base de datos y servidor
const db = require('./config/jsondb');

const startServer = async () => {
  try {
    console.log('Iniciando servidor...');
    await db.init();
    console.log('Base de datos inicializada correctamente');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor EMB ejecutándose en puerto ${PORT}`);
      console.log(`📊 Panel de administración: http://localhost:${PORT}/api/test`);
      console.log(`🐳 Docker: Servidor accesible desde otros contenedores`);
    });
    
    server.on('error', (error) => {
      console.error('Error del servidor:', error);
    });
    
  } catch (error) {
    console.error('Error al inicializar el servidor:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

startServer();

module.exports = app;

