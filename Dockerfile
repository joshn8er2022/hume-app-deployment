# Simple Node.js build
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# Copy and install backend dependencies
COPY server/package*.json ./
RUN npm install

# Copy backend source
COPY server/ ./

# Copy pre-built frontend (we'll build it locally first)
COPY client/dist ./public

# Expose port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start server
CMD ["npm", "start"]