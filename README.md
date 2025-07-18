# EMB Billing System

Sistema de facturación completo para EMB - Empresa de desarrollo web con 4 autónomos.

## 🚀 Características

- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Vite + TailwindCSS
- **Autenticación**: JWT con usuarios predefinidos
- **Gestión completa**: Clientes, Servicios, Facturas y Dashboard
- **Cumplimiento legal**: Adaptado a requisitos españoles (IVA, numeración, etc.)

## 👥 Usuarios del Sistema

El sistema incluye 4 usuarios predefinidos (los autónomos de EMB):

- **Aguayo**: `aguayo@emb.com` / `password123`
- **Pepe**: `pepe@emb.com` / `password123`  
- **Andrés**: `andres@emb.com` / `password123`
- **Alex**: `alex@emb.com` / `password123`

## 🛠️ Servicios Predefinidos

1. **Desarrollo Web** - €800 (21% IVA)
2. **Marketing** - €500 (21% IVA)
3. **SEO** - €300 (21% IVA)
4. **Hosting** - €50 (21% IVA)
5. **Mantenimiento** - €100 (21% IVA)

## 🚀 Instalación y Uso

### Opción 1: Inicio Rápido
```bash
# Ejecutar el script de inicio (Windows)
start.bat
```

### Opción 2: Manual

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 URLs del Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Test API**: http://localhost:3001/api/test

## 📊 Funcionalidades

### Dashboard
- Resumen de estadísticas generales
- Ingresos totales y mensuales
- Facturas pendientes y vencidas
- Servicios más vendidos
- Facturas recientes

### Gestión de Clientes
- Crear, editar y eliminar clientes
- Información completa: nombre, email, teléfono, dirección, CIF/NIF
- Búsqueda y filtrado
- Validación de eliminación (no se puede eliminar si tiene facturas)

### Gestión de Servicios
- CRUD completo de servicios
- Configuración de precios e IVA
- Cálculo automático de precio final
- Búsqueda y filtrado

### Gestión de Facturas
- Creación de facturas con múltiples items
- Numeración automática
- Cálculo automático de totales e IVA
- Estados: Pendiente, Pagada, Vencida, Cancelada
- Filtrado por estado y búsqueda
- Eliminación con confirmación

## 🗄️ Base de Datos

El sistema utiliza SQLite con las siguientes tablas:

- `users`: Usuarios del sistema (autónomos)
- `clients`: Clientes de EMB
- `services`: Servicios ofrecidos
- `invoices`: Facturas generadas
- `invoice_items`: Items de cada factura

## 🔐 Seguridad

- Autenticación JWT
- Contraseñas encriptadas con bcrypt
- Middleware de verificación de token
- Rutas protegidas

## 🎨 Diseño

- **TailwindCSS**: Todos los estilos utilizan Tailwind
- **Responsive**: Adaptado a móviles y escritorio
- **Colores EMB**: Paleta personalizada de colores
- **Iconos**: Lucide React para iconografía consistente

## 📝 Notas Técnicas

- La base de datos se crea automáticamente al iniciar el backend
- Los datos de ejemplo se insertan en el primer arranque
- El sistema está preparado para producción con variables de entorno
- Advertencias CSS de Tailwind son normales y no afectan funcionalidad

## 🔧 Configuración

### Variables de Entorno (.env)
```
PORT=3001
JWT_SECRET=emb_secret_key_2025
NODE_ENV=development
```

**⚠️ IMPORTANTE**: Cambiar `JWT_SECRET` en producción por un valor seguro.

## 🚀 Próximas Mejoras

- Generación de PDFs para facturas
- Exportación de datos
- Reportes avanzados
- Notificaciones por email
- Backup automático de base de datos

---

**Desarrollado para EMB** - Sistema de facturación simple, funcional y legalmente válido para España.
