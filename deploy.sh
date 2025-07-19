#!/bin/bash

# Script de deployment para EMB Panel
# Uso: ./deploy.sh [production|development]

set -e

# Configuración
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

echo "🚀 Iniciando deployment del EMB Panel en modo: $ENVIRONMENT"

# Función para limpiar en caso de error
cleanup() {
    echo "❌ Error durante el deployment. Limpiando..."
    docker-compose down --remove-orphans
    exit 1
}

# Configurar trap para cleanup en caso de error
trap cleanup ERR

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker y vuelve a intentar."
    exit 1
fi

# Verificar que docker-compose está disponible
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose no está instalado. Por favor instálalo y vuelve a intentar."
    exit 1
fi

echo "📋 Verificando archivos necesarios..."

# Verificar que existen los archivos necesarios
required_files=(
    "docker-compose.yml"
    "frontend/Dockerfile"
    "frontend/server.py"
    "backend/Dockerfile"
    "backend/healthcheck.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Archivo requerido no encontrado: $file"
        exit 1
    fi
done

echo "✅ Todos los archivos necesarios están presentes"

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down --remove-orphans

# Limpiar imágenes antiguas (opcional)
echo "🧹 Limpiando imágenes antiguas..."
docker system prune -f

# Construir las imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache

# Verificar que las imágenes se construyeron correctamente
echo "🔍 Verificando imágenes construidas..."
if ! docker images | grep -q "panelemb"; then
    echo "⚠️  Advertencia: No se encontraron imágenes con el prefijo esperado"
fi

# Iniciar los servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar el estado de los servicios
echo "🔍 Verificando estado de los servicios..."

# Verificar backend
echo "Verificando backend..."
for i in {1..30}; do
    if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
        echo "✅ Backend está funcionando"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend no responde después de 30 intentos"
        docker-compose logs backend
        exit 1
    fi
    echo "Intento $i/30 - Esperando backend..."
    sleep 2
done

# Verificar frontend
echo "Verificando frontend..."
for i in {1..30}; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend está funcionando"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend no responde después de 30 intentos"
        docker-compose logs frontend
        exit 1
    fi
    echo "Intento $i/30 - Esperando frontend..."
    sleep 2
done

# Mostrar estado final
echo "📊 Estado final de los contenedores:"
docker-compose ps

echo "📋 Logs recientes:"
echo "--- Backend ---"
docker-compose logs --tail=10 backend
echo "--- Frontend ---"
docker-compose logs --tail=10 frontend

echo ""
echo "🎉 ¡Deployment completado exitosamente!"
echo ""
echo "🌐 Servicios disponibles:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3002"
echo "   API Test: http://localhost:3002/api/test"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:        docker-compose logs -f"
echo "   Detener:         docker-compose down"
echo "   Reiniciar:       docker-compose restart"
echo "   Estado:          docker-compose ps"
echo ""

# Si estamos en producción, mostrar información adicional
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔒 Configuración de producción:"
    echo "   - Asegúrate de que Nginx Proxy Manager esté configurado"
    echo "   - Verifica que el dominio panel.embdevs.com apunte a este servidor"
    echo "   - Los contenedores están configurados para reiniciarse automáticamente"
fi
