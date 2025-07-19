# 🐳 EMB Panel - Deployment con Docker

Este documento describe cómo deployar el EMB Billing System usando Docker de manera robusta y escalable.

## 📋 Prerrequisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- Acceso al servidor Ubuntu VPS

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Nginx Proxy    │    │   Frontend      │    │    Backend      │
│   Manager       │────│  (Python)       │────│   (Node.js)     │
│  (Port 80/443)  │    │  (Port 5173)    │    │  (Port 3002)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                         ┌─────────────────┐    ┌─────────────────┐
                         │  Static Files   │    │   SQLite DB     │
                         │   (React SPA)   │    │   (Persistent)  │
                         └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Rápido

### 1. Clonar el repositorio en el servidor

```bash
git clone https://github.com/AlejndroSG/PanelEMB.git
cd PanelEMB
```

### 2. Ejecutar el script de deployment

```bash
chmod +x deploy.sh
./deploy.sh production
```

## 📝 Deployment Manual

### 1. Preparar el entorno

```bash
# Asegurarse de que Docker está corriendo
sudo systemctl start docker
sudo systemctl enable docker

# Verificar versiones
docker --version
docker-compose --version
```

### 2. Construir y ejecutar

```bash
# Construir las imágenes
docker-compose build --no-cache

# Iniciar los servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

### 3. Verificar deployment

```bash
# Health check backend
curl http://localhost:3002/api/health

# Health check frontend
curl http://localhost:5173

# Ver logs
docker-compose logs -f
```

## 🔧 Configuración

### Variables de Entorno

El archivo `docker-compose.yml` incluye las siguientes variables:

**Backend:**
- `NODE_ENV=production`
- `PORT=3002`
- `JWT_SECRET=embsecret2025`

**Frontend:**
- `NODE_ENV=production`
- `VITE_API_URL=https://panel.embdevs.com`

### Volúmenes Persistentes

- `backend_data`: Base de datos SQLite
- `backend_logs`: Logs del backend

### Red

- Red personalizada `emb-network` (172.20.0.0/16)
- Comunicación interna entre contenedores

## 🔍 Monitoreo y Logs

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Health Checks

Los contenedores incluyen health checks automáticos:

- **Backend**: Verifica endpoint `/api/health` cada 30s
- **Frontend**: Verifica que el servidor Python responda cada 30s

### Estado de los servicios

```bash
# Estado general
docker-compose ps

# Detalles de un servicio
docker inspect emb-backend
docker inspect emb-frontend
```

## 🛠️ Comandos Útiles

### Gestión de servicios

```bash
# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Debugging

```bash
# Acceder al contenedor backend
docker-compose exec backend sh

# Acceder al contenedor frontend
docker-compose exec frontend sh

# Ver recursos utilizados
docker stats
```

### Limpieza

```bash
# Limpiar contenedores parados
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpieza completa (¡CUIDADO!)
docker system prune -a
```

## 🔒 Configuración de Nginx Proxy Manager

### 1. Agregar Proxy Host

En Nginx Proxy Manager:

1. **Domain Names**: `panel.embdevs.com`
2. **Scheme**: `http`
3. **Forward Hostname/IP**: `172.17.0.1` (Docker host IP)
4. **Forward Port**: `5173`

### 2. Configuración SSL

1. Habilitar **SSL**
2. Seleccionar **Request a new SSL Certificate**
3. Usar **Let's Encrypt**
4. Habilitar **Force SSL**

### 3. Advanced Configuration

```nginx
# Configuración adicional para SPA
location / {
    try_files $uri $uri/ /index.html;
}

# Headers para assets estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🚨 Troubleshooting

### Problema: Contenedores no inician

```bash
# Ver logs detallados
docker-compose logs

# Verificar recursos del sistema
df -h
free -h
```

### Problema: Frontend no carga

```bash
# Verificar que el build fue exitoso
docker-compose exec frontend ls -la dist/

# Verificar servidor Python
docker-compose exec frontend python -c "import http.server; print('OK')"
```

### Problema: Backend no responde

```bash
# Verificar base de datos
docker-compose exec backend ls -la database/

# Verificar dependencias Node.js
docker-compose exec backend npm list
```

### Problema: Nginx Proxy Manager no conecta

1. Verificar que los contenedores están en la red correcta
2. Usar IP del host Docker: `172.17.0.1`
3. Verificar puertos expuestos: `3002` y `5173`

## 📊 Optimizaciones de Producción

### 1. Recursos

```yaml
# Agregar al docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### 2. Logging

Los logs están configurados con rotación automática:
- Tamaño máximo: 10MB por archivo
- Máximo 3 archivos por servicio

### 3. Security

- Contenedores corren con usuario no-root
- Volúmenes persistentes para datos importantes
- Health checks para detección temprana de problemas

## 🔄 Actualizaciones

### Proceso de actualización

```bash
# 1. Hacer backup de la base de datos
docker-compose exec backend cp database/emb.db database/emb.db.backup

# 2. Actualizar código
git pull

# 3. Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Verificar funcionamiento
./deploy.sh production
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Ejecuta health checks manuales
4. Consulta este documento para troubleshooting

---

**¡El EMB Panel está listo para producción con Docker! 🎉**
