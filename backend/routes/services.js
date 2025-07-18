const express = require('express');
const db = require('../config/jsondb');
const authRouter = require('./auth');
const verifyToken = authRouter.verifyToken;

const router = express.Router();

// Obtener todos los servicios
router.get('/', verifyToken, (req, res) => {
  const services = db.getAllServices();
  res.json({ services });
});

// Obtener un servicio por ID
router.get('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const service = db.getServiceById(id);
  
  if (!service) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  res.json({ service });
});

// Crear nuevo servicio
router.post('/', verifyToken, (req, res) => {
  const { name, description, price, iva_rate } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  const serviceData = {
    name,
    description: description || '',
    price: parseFloat(price),
    iva_rate: iva_rate || 21
  };

  const service = db.createService(serviceData);
  
  res.status(201).json({ 
    message: 'Servicio creado exitosamente',
    service 
  });
});

// Actualizar servicio
router.put('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description, price, iva_rate } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  const updateData = {
    name,
    description: description || '',
    price: parseFloat(price),
    iva_rate: iva_rate || 21
  };

  const updated = db.updateService(id, updateData);
  
  if (!updated) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  res.json({ message: 'Servicio actualizado exitosamente' });
});

// Eliminar servicio
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  const deleted = db.deleteService(id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }
  
  res.json({ message: 'Servicio eliminado exitosamente' });
});

module.exports = router;
