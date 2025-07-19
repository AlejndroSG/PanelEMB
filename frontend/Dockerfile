# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Python
FROM python:3.11-alpine AS production

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy the Python server script
COPY server.py ./

# Expose port
EXPOSE 5173

# Start the Python server
CMD ["python", "server.py"]