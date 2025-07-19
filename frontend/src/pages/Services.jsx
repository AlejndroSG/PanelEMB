import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, CreditCard, Euro, Settings, X } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emb-600 to-emb-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
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
              {/* Información del Servicio */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-emb-600" />
                  Información del Servicio
                </h3>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Nombre del servicio *</label>
                    <div className="input-with-icon">
                      <Settings className="input-icon h-5 w-5" />
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej: Desarrollo Web, Consultoría SEO..."
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción del servicio</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      placeholder="Describe detalladamente el servicio que ofreces, qué incluye, beneficios..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Información de Precios */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Euro className="h-5 w-5 mr-2 text-emb-600" />
                  Precios e Impuestos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Precio base (€) *</label>
                    <div className="input-with-icon">
                      <Euro className="input-icon h-5 w-5" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="form-input"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de IVA</label>
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
              </div>

              {/* Resumen de Precios */}
              {formData.price && (
                <div className="bg-gradient-to-r from-emb-50 to-emb-100 rounded-xl p-6 border border-emb-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-emb-600" />
                    Resumen de Precios
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Precio base:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(formData.price) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IVA ({formData.iva_rate}%):</span>
                      <span className="font-medium">{formatCurrency((parseFloat(formData.price) || 0) * (parseFloat(formData.iva_rate) / 100))}</span>
                    </div>
                    <div className="border-t border-emb-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Precio final:</span>
                        <span className="text-2xl font-bold text-emb-600">
                          {formatCurrency((parseFloat(formData.price) || 0) * (1 + parseFloat(formData.iva_rate) / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  <Settings className="h-4 w-4" />
                  <span>{editingService ? 'Actualizar Servicio' : 'Crear Servicio'}</span>
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

export default Services;
