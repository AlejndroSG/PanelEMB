import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar axios con el token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(API_ENDPOINTS.PROFILE);
          setUser(response.data.user);
        } catch (error) {
          console.error('Error verificando token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('Intentando login en:', API_ENDPOINTS.LOGIN);
      
      // Configuración con timeout para evitar esperas infinitas
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        email,
        password
      }, {
        timeout: 5000, // 5 segundos máximo
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      return { success: true };
    } catch (error) {
      console.error('Error detallado en login:', error);
      
      // Mostrar mensaje específico según el tipo de error
      let errorMessage = 'Error de conexión';
      
      if (error.response) {
        // El servidor respondió con un código de error
        errorMessage = error.response.data?.error || `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'El servidor no responde. Comprueba la conexión.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
