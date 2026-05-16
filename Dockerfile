FROM node:20-alpine AS client-build

ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

COPY server/ ./
COPY --from=client-build /app/client/dist ./public

RUN mkdir -p /app/uploads /app/data

ENV STATIC_DIR=/app/public
ENV PORT=3002

VOLUME ["/app/uploads", "/app/data"]

EXPOSE 3002

CMD ["node", "index.js"]
