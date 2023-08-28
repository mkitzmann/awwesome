FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
