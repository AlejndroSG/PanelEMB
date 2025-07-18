import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Invoices from './pages/Invoices';

// Configurar axios globalmente para incluir el token de autenticación
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Layout>
                  <Clients />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/services" element={
              <ProtectedRoute>
                <Layout>
                  <Services />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/invoices" element={
              <ProtectedRoute>
                <Layout>
                  <Invoices />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
