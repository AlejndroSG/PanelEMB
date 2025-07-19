#!/usr/bin/env python3
"""
Servidor HTTP personalizado para servir la aplicación React SPA
con soporte para routing del lado del cliente y MIME types correctos.
"""

import os
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SPAHandler(SimpleHTTPRequestHandler):
    """
    Handler personalizado para Single Page Applications (SPA)
    que maneja el routing del lado del cliente correctamente.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='dist', **kwargs)
    
    def end_headers(self):
        # Agregar headers de seguridad y CORS
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_GET(self):
        """
        Maneja las peticiones GET con soporte para SPA routing.
        """
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remover query parameters para el manejo de archivos
        clean_path = path.lstrip('/')
        
        # Construir la ruta completa del archivo
        full_path = os.path.join('dist', clean_path)
        
        # Si es la raíz, servir index.html
        if path == '/' or path == '':
            self.serve_index()
            return
        
        # Si el archivo existe, servirlo
        if os.path.isfile(full_path):
            self.serve_file(full_path)
            return
        
        # Si es un directorio y contiene index.html, servirlo
        if os.path.isdir(full_path):
            index_path = os.path.join(full_path, 'index.html')
            if os.path.isfile(index_path):
                self.serve_file(index_path)
                return
        
        # Para rutas que no corresponden a archivos (SPA routing), servir index.html
        # Esto permite que React Router maneje las rutas del lado del cliente
        if not self.is_asset_request(path):
            self.serve_index()
            return
        
        # Si llegamos aquí, es un archivo que no existe
        self.send_error(404, "File not found")
    
    def serve_index(self):
        """Sirve el archivo index.html principal."""
        index_path = os.path.join('dist', 'index.html')
        if os.path.isfile(index_path):
            self.serve_file(index_path)
        else:
            self.send_error(500, "index.html not found")
    
    def serve_file(self, file_path):
        """
        Sirve un archivo específico con el MIME type correcto.
        """
        try:
            # Determinar el MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            
            # MIME types específicos para archivos web
            if file_path.endswith('.js'):
                mime_type = 'application/javascript'
            elif file_path.endswith('.mjs'):
                mime_type = 'application/javascript'
            elif file_path.endswith('.css'):
                mime_type = 'text/css'
            elif file_path.endswith('.html'):
                mime_type = 'text/html'
            elif file_path.endswith('.json'):
                mime_type = 'application/json'
            elif file_path.endswith('.svg'):
                mime_type = 'image/svg+xml'
            elif file_path.endswith('.ico'):
                mime_type = 'image/x-icon'
            
            # Fallback para MIME type
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            # Leer y servir el archivo
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            
            # Cache headers para assets estáticos
            if self.is_asset_request(file_path):
                self.send_header('Cache-Control', 'public, max-age=31536000')  # 1 año
            else:
                self.send_header('Cache-Control', 'no-cache')
            
            self.end_headers()
            self.wfile.write(content)
            
            logger.info(f"Served: {file_path} ({mime_type})")
            
        except IOError:
            self.send_error(404, "File not found")
        except Exception as e:
            logger.error(f"Error serving file {file_path}: {e}")
            self.send_error(500, "Internal server error")
    
    def is_asset_request(self, path):
        """
        Determina si una petición es para un asset estático.
        """
        asset_extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot']
        return any(path.lower().endswith(ext) for ext in asset_extensions)
    
    def log_message(self, format, *args):
        """Override para personalizar el logging."""
        logger.info(f"{self.address_string()} - {format % args}")

def run_server():
    """
    Inicia el servidor HTTP.
    """
    # Configuración del servidor
    port = int(os.environ.get('PORT', 5173))
    host = '0.0.0.0'  # Escuchar en todas las interfaces para Docker
    
    # Verificar que el directorio dist existe
    if not os.path.exists('dist'):
        logger.error("Directory 'dist' not found. Make sure to build the React app first.")
        return
    
    # Verificar que index.html existe
    if not os.path.exists('dist/index.html'):
        logger.error("index.html not found in dist directory.")
        return
    
    # Crear y configurar el servidor
    server_address = (host, port)
    httpd = HTTPServer(server_address, SPAHandler)
    
    logger.info(f"Starting EMB Panel server on http://{host}:{port}")
    logger.info(f"Serving files from: {os.path.abspath('dist')}")
    logger.info("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        httpd.server_close()
        logger.info("Server closed")

if __name__ == '__main__':
    run_server()
