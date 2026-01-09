# Multi-stage build for React frontend and Node backend

# --- Stage 1: Build Frontend and Backend ---
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build frontend (outputs to client/dist)
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# --- Stage 2: Production Image ---
FROM node:18-alpine
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy backend source files
COPY index.js ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Copy Prisma schema and generated client
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built frontend assets
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port (matching index.js default port 8080)
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production

# Start command: run migrations and start server in production mode
CMD ["sh", "-c", "npx prisma migrate deploy && NODE_ENV=production node index.js"]
