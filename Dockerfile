# Multi-stage build for React frontend and Node backend

# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:18-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
# Generate Prisma Client
RUN npx prisma generate

# --- Stage 3: Production Image ---
FROM node:18-alpine
WORKDIR /app

# Install production dependencies for backend only
COPY server/package*.json ./
RUN npm install --production

# Copy backend source
COPY server/ ./
# Copy built frontend assets to backend's public directory (or specific static folder)
COPY --from=frontend-builder /app/client/dist ./public
# Copy Prisma artifacts
COPY --from=backend-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/server/node_modules/@prisma ./node_modules/@prisma

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start command (Run migrations and start server)
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
