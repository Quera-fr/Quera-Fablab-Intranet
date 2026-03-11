FROM node:20-bookworm-slim

# Install native dependencies required for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ libsqlite3-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly (resolves optionalDependencies correctly for the target OS)
# Also clear npm cache
RUN npm ci


# Copy application files
COPY . .

RUN npm run build
RUN npx playwright install-deps
# Expose ports
# 3000 is used for the API server
# 5173 is the default Vite preview port, but we will likely run the built app through the same server
EXPOSE 3000
EXPOSE 5173

# Start the Node.js server to serve API and static files
# We use a tool like tsx since server.ts is written in TypeScript
<<<<<<< HEAD
CMD ["npx", "tsx", "server.ts", "playwright", "test"]
=======
CMD ["npx", "tsx", "server.ts", "playwright, test"]
>>>>>>> test-unitaires-prativa
