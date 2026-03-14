FROM node:20-slim AS build
RUN apt-get update && apt-get install -y python3 make g++ git && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:20-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build/index.js"]
