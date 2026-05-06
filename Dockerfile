FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

COPY server/ ./
COPY --from=client-build /app/client/dist ./public

RUN mkdir -p /app/uploads

ENV STATIC_DIR=/app/public
ENV PORT=3002

VOLUME ["/app/uploads", "/app/database.sqlite"]

EXPOSE 3002

CMD ["node", "index.js"]
