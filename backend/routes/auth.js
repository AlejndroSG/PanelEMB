const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/jsondb');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'emb_secret_key_2025';

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const user = db.getUserByEmail(email);
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login exitoso',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Obtener perfil del usuario
router.get('/profile', verifyToken, (req, res) => {
  const user = db.getUserById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({ 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Obtener todos los usuarios (para el dashboard)
router.get('/users', verifyToken, (req, res) => {
  db.getDB().all(
    'SELECT id, name, email, role, created_at FROM users ORDER BY name',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Error del servidor' });
      }

      res.json({ users });
    }
  );
});

module.exports = router;
module.exports.verifyToken = verifyToken;
