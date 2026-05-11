FROM node:20-alpine

WORKDIR /app

# Server dependencies
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

# Client dependencies + build
COPY client/package*.json ./client/
RUN npm install --prefix client
COPY client/ ./client/
RUN npm run build --prefix client

# Server source
COPY server/ ./server/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/src/index.js"]
