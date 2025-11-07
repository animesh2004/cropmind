FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

