FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN chmod +x scripts/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
