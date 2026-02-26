# syntax=docker/dockerfile:1

# Stage 1: Build Image
FROM node:22-alpine AS builder

# Install build tools for native dependencies (like better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production Dependencies Image
FROM node:22-alpine AS deps

# Install build tools for native dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 3: Runner Image
FROM node:22-alpine AS runner

WORKDIR /app

# Set node environment to production
ENV NODE_ENV=production

# Copy necessary files from deps and builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Expose the application port
EXPOSE 3001

# Command to start the application
CMD ["node", "dist/main.js"]
