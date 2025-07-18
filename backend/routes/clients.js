const express = require('express');
const db = require('../config/jsondb');
const authRouter = require('./auth');
const verifyToken = authRouter.verifyToken;

const router = express.Router();

// Obtener todos los clientes
router.get('/', verifyToken, (req, res) => {
  const clients = db.getAllClients();
  res.json({ clients });
});

// Obtener un cliente por ID
router.get('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const client = db.getClientById(id);
  
  if (!client) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  res.json({ client });
});

// Crear nuevo cliente
router.post('/', verifyToken, (req, res) => {
  const { name, email, phone, address, city, postal_code, cif_nif } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  const clientData = {
    name,
    email: email || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    postal_code: postal_code || '',
    cif_nif: cif_nif || ''
  };

  const client = db.createClient(clientData);
  
  res.status(201).json({ 
    message: 'Cliente creado exitosamente',
    client 
  });
});

// Actualizar cliente
router.put('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, city, postal_code, cif_nif } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  const updateData = {
    name,
    email: email || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    postal_code: postal_code || '',
    cif_nif: cif_nif || ''
  };

  const updated = db.updateClient(id, updateData);
  
  if (!updated) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  res.json({ message: 'Cliente actualizado exitosamente' });
});

// Eliminar cliente
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  const deleted = db.deleteClient(id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  
  res.json({ message: 'Cliente eliminado exitosamente' });
});

module.exports = router;
