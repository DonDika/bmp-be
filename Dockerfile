FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Install Prisma Client
RUN npx prisma generate

EXPOSE 5001

CMD ["npm", "start"]

# FROM node:20

# WORKDIR /app

# COPY . .

# RUN npm install

# CMD ["npm", "start"]

# EXPOSE 3000