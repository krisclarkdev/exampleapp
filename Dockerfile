# Use the official Node.js 18 LTS image as the base
FROM node:18-alpine

# Set environment variables
# Prevents Node.js from buffering stdout and stderr, allowing for better logging
ENV NODE_ENV=production
ENV PORT=3000

# Create and set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Build your application (if you have any build steps, e.g., TypeScript)
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run your app
CMD ["node", "app.js"]
