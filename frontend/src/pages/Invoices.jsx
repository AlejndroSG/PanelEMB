import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Eye, Edit, Trash2, Download, Filter, Calendar, FileText, X } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    due_date: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchServices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.INVOICES);
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CLIENTS);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.SERVICES);
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    // Validación adicional
    if (formData.items.length === 0) {
      alert('Debe agregar al menos un item a la factura');
      return;
    }
    
    // Validar que todos los items tengan datos completos
    const invalidItems = formData.items.some(item => 
      !item.service_id || !item.quantity || !item.unit_price || !item.iva_rate
    );
    
    if (invalidItems) {
      alert('Todos los campos de los items son obligatorios');
      return;
    }
    
    try {
      const invoiceData = {
        ...formData,
        items: formData.items.map(item => ({
          service_id: parseInt(item.service_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          iva_rate: parseFloat(item.iva_rate)
        }))
      };

      await axios.post(API_ENDPOINTS.INVOICES, invoiceData);
      fetchInvoices();
      setShowCreateModal(false);
      resetForm();
      alert('✅ Factura creada exitosamente');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error al crear la factura: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      try {
        await axios.delete(API_ENDPOINTS.INVOICE_BY_ID(id));
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error al eliminar la factura');
      }
    }
  };

  const handleViewInvoice = async (id) => {
    try {
      const response = await axios.get(API_ENDPOINTS.INVOICE_VIEW(id));
      setSelectedInvoice(response.data.invoice);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      alert('Error al cargar la factura');
    }
  };

  const handleDownloadInvoice = async (id, invoiceNumber) => {
    try {
      const response = await axios.get(API_ENDPOINTS.INVOICE_PDF(id), {
        responseType: 'blob'
      });
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error al descargar la factura');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      console.log('🔄 Cambiando estado de factura:', { id, newStatus });
      
      const response = await axios.patch(API_ENDPOINTS.INVOICE_STATUS(id), {
        status: newStatus
      });
      
      console.log('✅ Respuesta del servidor:', response.data);
      
      // Actualizar la lista de facturas inmediatamente
      await fetchInvoices();
      
      // Mostrar mensaje de éxito más discreto
      console.log('✅ Estado actualizado correctamente');
    } catch (error) {
      console.error('❌ Error updating status:', error);
      
      // Mostrar mensaje de error más detallado
      if (error.response) {
        console.error('Error del servidor:', error.response.data);
        alert(`Error: ${error.response.data.error || 'Error desconocido'}`);
      } else if (error.request) {
        console.error('Error de red:', error.request);
        alert('Error de conexión. Verifica que el servidor esté funcionando.');
      } else {
        console.error('Error:', error.message);
        alert('Error inesperado. Intenta de nuevo.');
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        service_id: '',
        quantity: 1,
        unit_price: '',
        iva_rate: 21
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill price and IVA when service is selected
    if (field === 'service_id' && value) {
      const service = services.find(s => s.id === parseInt(value));
      if (service) {
        newItems[index].unit_price = service.price || 0;
        // Establecemos un IVA por defecto del 21% si no viene definido en el servicio
        newItems[index].iva_rate = 21;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      items: []
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-badge status-pending',
      paid: 'status-badge status-paid',
      overdue: 'status-badge status-overdue',
      cancelled: 'status-badge status-cancelled'
    };
    
    const statusText = {
      pending: 'Pendiente',
      paid: 'Pagada',
      overdue: 'Vencida',
      cancelled: 'Cancelada'
    };
    
    return (
      <span className={badges[status] || badges.pending}>
        {statusText[status] || 'Pendiente'}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const iva = subtotal * ((item.iva_rate || 0) / 100);
    return subtotal + iva;
  };

  const calculateInvoiceTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emb-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600 text-sm sm:text-base">Gestiona todas tus facturas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="input-with-icon flex-1 min-w-0">
            <Search className="input-icon h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar facturas..."
              className="form-input w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-48 flex-shrink-0">
            <select
              className="form-input w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagadas</option>
              <option value="overdue">Vencidas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
            <button className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <button className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        {/* Vista de tabla para desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Número</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Vencimiento</th>
                <th className="table-header">Total</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{invoice.invoice_number}</td>
                  <td className="table-cell">{invoice.client_name}</td>
                  <td className="table-cell">{formatDate(invoice.issue_date)}</td>
                  <td className="table-cell">{formatDate(invoice.due_date)}</td>
                  <td className="table-cell">
                    <div className="price-display">
                      {formatCurrency(invoice.total).replace('€', '')}
                      <span className="currency-symbol">€</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="relative inline-block">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className="appearance-none bg-transparent border-none text-sm font-semibold cursor-pointer focus:outline-none pr-6 min-w-0 max-w-[120px]"
                        style={{
                          color: invoice.status === 'paid' ? '#10b981' :
                                 invoice.status === 'pending' ? '#f59e0b' :
                                 invoice.status === 'overdue' ? '#ef4444' : '#6b7280'
                        }}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagada</option>
                        <option value="overdue">Vencida</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="p-1 text-gray-400 hover:text-emb-600"
                        title="Ver factura"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Eliminar factura"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de cards para móvil y tablet */}
        <div className="lg:hidden space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="invoice-item">
              <div className="flex justify-between items-start">
                <div className="form-group">
                  <p className="text-lg font-bold text-gray-900">#{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-600 truncate">{invoice.client_name}</p>
                </div>
                <div className="text-right">
                  <div className="price-display text-xl">
                    {formatCurrency(invoice.total).replace('€', '')}
                    <span className="currency-symbol">€</span>
                  </div>
                  <div className="mt-2">
                    <div className={`inline-flex items-center ${
                      invoice.status === 'paid' ? 'status-paid' :
                      invoice.status === 'pending' ? 'status-pending' :
                      invoice.status === 'overdue' ? 'status-overdue' :
                      'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold'
                    }`}>
                      {invoice.status === 'paid' ? 'Pagada' :
                       invoice.status === 'pending' ? 'Pendiente' :
                       invoice.status === 'overdue' ? 'Vencida' : 'Cancelada'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="form-group">
                  <span className="font-medium">Fecha:</span> {formatDate(invoice.issue_date)}
                </div>
                <div className="form-group">
                  <span className="font-medium">Vence:</span> {formatDate(invoice.due_date)}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewInvoice(invoice.id)}
                    className="p-2 text-gray-400 hover:text-emb-600 bg-white rounded border"
                    title="Ver factura"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                    className="p-2 text-gray-400 hover:text-green-600 bg-white rounded border"
                    title="Descargar PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="p-2 text-gray-400 hover:text-red-600 bg-white rounded border"
                    title="Eliminar factura"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
          
        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm sm:text-base">No se encontraron facturas</div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emb-600 to-emb-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Nueva Factura</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
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
            
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select
                    required
                    className="form-input"
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de emisión *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de vencimiento *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas adicionales</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Añade información adicional sobre la factura, términos de pago, condiciones especiales..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emb-100 p-2 rounded-lg">
                      <Plus className="h-5 w-5 text-emb-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Items de la factura</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-primary text-sm flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <label className="form-label">Servicio *</label>
                        <select
                          required
                          className="form-input"
                          value={item.service_id}
                          onChange={(e) => updateItem(index, 'service_id', e.target.value)}
                        >
                          <option value="">Seleccionar servicio</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>{service.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Cantidad *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Precio unitario *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          className="form-input"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">IVA (%) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          className="form-input"
                          value={item.iva_rate}
                          onChange={(e) => updateItem(index, 'iva_rate', e.target.value)}
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn-danger text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.items.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        Total: {formatCurrency(calculateInvoiceTotal())}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary px-8"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-8 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Crear Factura</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Factura {selectedInvoice.invoice_number}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Información del cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Cliente</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Nombre:</span> {selectedInvoice.client_name}</p>
                  {selectedInvoice.client_email && (
                    <p><span className="font-medium">Email:</span> {selectedInvoice.client_email}</p>
                  )}
                  {selectedInvoice.client_phone && (
                    <p><span className="font-medium">Teléfono:</span> {selectedInvoice.client_phone}</p>
                  )}
                  {selectedInvoice.client_address && (
                    <p><span className="font-medium">Dirección:</span> {selectedInvoice.client_address}</p>
                  )}
                </div>
              </div>

              {/* Información de la factura */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Factura</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Número:</span> {selectedInvoice.invoice_number}</p>
                  <p><span className="font-medium">Fecha de emisión:</span> {formatDate(selectedInvoice.issue_date)}</p>
                  <p><span className="font-medium">Fecha de vencimiento:</span> {formatDate(selectedInvoice.due_date)}</p>
                  <p><span className="font-medium">Estado:</span> {getStatusBadge(selectedInvoice.status)}</p>
                </div>
              </div>
            </div>

            {/* Items de la factura */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.items.map((item, index) => {
                      const subtotal = item.quantity * item.unit_price;
                      const iva = subtotal * (item.iva_rate / 100);
                      const total = subtotal + iva;
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="form-group">
                              <div className="text-sm font-medium text-gray-900">{item.service_name}</div>
                              {item.service_description && (
                                <div className="text-sm text-gray-500">{item.service_description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.iva_rate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total de la Factura:</span>
                <span className="text-2xl font-bold text-emb-600">{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>

            {/* Notas */}
            {selectedInvoice.notes && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Notas</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedInvoice.notes}</p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice.id, selectedInvoice.invoice_number)}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Descargar PDF</span>
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
