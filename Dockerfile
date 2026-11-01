# 1. Use an official Node.js lightweight image as the base
FROM node:20-alpine AS base

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# 4. Copy the rest of your application code
COPY . .

# 5. Set dummy environment variables for the build process
# (Next.js needs these to exist so it doesn't crash during compilation)
ENV NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy_key"

# 6. Build the Next.js app
RUN npm run build

# 7. Expose port 3000
EXPOSE 3000

# 8. Start the production server
CMD ["npm", "run", "start"]