FROM node:20-slim

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install ALL dependencies including devDependencies (vite is a devDep)
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the React/Vite app into the dist/ folder
RUN npm run build

# Use serve to host the static files
RUN npm install -g serve

# Expose port and start serving
EXPOSE 8080
CMD serve -s dist -l $PORT
