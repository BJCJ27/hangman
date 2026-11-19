# Hangman API: Express + AWS SDK, talks to the DynamoDB Local container
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package.json package-lock.json* ./
RUN npm install

# Copy the server code
COPY . .

EXPOSE 4000

# nodemon restarts the API when a server file changes
CMD ["npm", "run", "dev"]
