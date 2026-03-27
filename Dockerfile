FROM node:20-bookworm-slim


WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly (resolves optionalDependencies correctly for the target OS)
# Also clear npm cache
RUN npm ci


# Copy application files
COPY . .

RUN npm run build

# Expose ports
# 3000 is used for the API server
EXPOSE 3000

# Start the Node.js server to serve API and static files
# We use a tool like tsx since server.ts is written in TypeScript
CMD ["npx", "tsx", "server.ts"]
