FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build && npm prune --omit=dev

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK CMD curl -fs http://localhost:${PORT}/ || exit 1

CMD ["node", "dist/index.js"]
