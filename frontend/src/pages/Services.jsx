import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, CreditCard, Euro } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    iva_rate: '21'
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.SERVICES);
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        iva_rate: parseFloat(formData.iva_rate)
      };

      if (editingService) {
        await axios.put(API_ENDPOINTS.SERVICE_BY_ID(editingService.id), serviceData);
      } else {
        await axios.post(API_ENDPOINTS.SERVICES, serviceData);
      }
      
      fetchServices();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      try {
        await axios.delete(API_ENDPOINTS.SERVICE_BY_ID(id));
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error al eliminar servicio. Puede que esté en uso en facturas.');
      }
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      iva_rate: service.iva_rate?.toString() || '21'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      iva_rate: '21'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600">Gestiona los servicios que ofrece EMB</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="input-with-icon">
          <Search className="input-icon h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-1 text-gray-400 hover:text-emb-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
            
            {service.description && (
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Precio base:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(service.price)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">IVA:</span>
                <span className="text-sm font-medium text-gray-900">
                  {service.iva_rate}%
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">Precio final:</span>
                <span className="font-bold text-emb-600">
                  {formatCurrency(service.price * (1 + service.iva_rate / 100))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron servicios</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Precio (€) *</label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="form-input pl-10"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">IVA (%)</label>
                  <select
                    className="form-input"
                    value={formData.iva_rate}
                    onChange={(e) => setFormData({...formData, iva_rate: e.target.value})}
                  >
                    <option value="4">4% (Superreducido)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="21">21% (General)</option>
                  </select>
                </div>
              </div>

              {formData.price && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Precio base:</span>
                    <span>{formatCurrency(parseFloat(formData.price) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA ({formData.iva_rate}%):</span>
                    <span>{formatCurrency((parseFloat(formData.price) || 0) * (parseFloat(formData.iva_rate) / 100))}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-emb-600">
                      {formatCurrency((parseFloat(formData.price) || 0) * (1 + parseFloat(formData.iva_rate) / 100))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
