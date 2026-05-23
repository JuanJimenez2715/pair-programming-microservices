FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install && npm install y-websocket@1.3.8
COPY . .
CMD ["npm", "start"]
