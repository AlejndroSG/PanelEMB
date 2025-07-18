FROM node:18

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies and rebuild native modules
RUN npm install && npm rebuild sqlite3

COPY . .

# Crear directorio de base de datos si no existe
RUN mkdir -p ./database

EXPOSE 3002

CMD ["npm", "start"]