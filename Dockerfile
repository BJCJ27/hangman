# Use Node 22 Alpine (Vite 8 needs Node 20.19+; the Node 18 image from the last homework is too old)
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# The game is served on port 3000
EXPOSE 3000

# --host 0.0.0.0 allows access from outside the container
# --port 3000 forces Vite to use 3000 instead of its default 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
