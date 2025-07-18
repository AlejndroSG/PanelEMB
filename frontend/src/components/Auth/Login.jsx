import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Usuarios de ejemplo para mostrar
  const exampleUsers = [
    { name: 'Aguayo', email: 'aguayo@emb.com' },
    { name: 'Pepe', email: 'pepe@emb.com' },
    { name: 'Andrés', email: 'andres@emb.com' },
    { name: 'Alex', email: 'alex@emb.com' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emb-50 to-emb-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto bg-emb-600 p-3 rounded-full w-16 h-16 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sistema EMB
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión en tu panel de facturación
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="form-input pl-10"
                  placeholder="tu@emb.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="form-input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        {/* Usuarios de ejemplo */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Usuarios disponibles (contraseña: emb2025)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {exampleUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => {
                  setEmail(user.email);
                  setPassword('emb2025');
                }}
                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="font-medium text-sm text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
