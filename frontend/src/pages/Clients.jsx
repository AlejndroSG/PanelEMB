import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Building, User, X } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    cif_nif: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CLIENTS);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(API_ENDPOINTS.CLIENT_BY_ID(editingClient.id), formData);
      } else {
        await axios.post(API_ENDPOINTS.CLIENTS, formData);
      }
      
      fetchClients();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await axios.delete(API_ENDPOINTS.CLIENT_BY_ID(id));
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error al eliminar cliente. Puede que tenga facturas asociadas.');
      }
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      postal_code: client.postal_code || '',
      cif_nif: client.cif_nif || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      cif_nif: ''
    });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cif_nif?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emb-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="input-with-icon">
          <Search className="input-icon h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emb-100 p-2 rounded-lg">
                <Building className="h-5 w-5 text-emb-600" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(client)}
                  className="p-1 text-gray-400 hover:text-emb-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{client.name}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              {client.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              
              {client.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{client.address}</span>
                </div>
              )}
              
              {client.cif_nif && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>CIF/NIF: {client.cif_nif}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emb-600 to-emb-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-emb-600" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Nombre completo *</label>
                    <div className="input-with-icon">
                      <User className="input-icon h-5 w-5" />
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej: Juan Pérez García"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="input-with-icon">
                      <Mail className="input-icon h-5 w-5" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <div className="input-with-icon">
                      <Phone className="input-icon h-5 w-5" />
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+34 123 456 789"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Dirección */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-emb-600" />
                  Dirección
                </h3>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Dirección completa</label>
                    <div className="input-with-icon">
                      <MapPin className="input-icon h-5 w-5" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Calle, número, piso..."
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Ciudad</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Madrid"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Código Postal</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="28001"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Fiscal */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-emb-600" />
                  Información Fiscal
                </h3>
                <div className="form-group">
                  <label className="form-label">CIF/NIF</label>
                  <div className="input-with-icon">
                    <Building className="input-icon h-5 w-5" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="12345678A o B12345678"
                      value={formData.cif_nif}
                      onChange={(e) => setFormData({...formData, cif_nif: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary px-8"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-8 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
