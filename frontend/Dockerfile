FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install vite globally as backup
RUN npm install -g vite

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start with host binding for Docker
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0"]