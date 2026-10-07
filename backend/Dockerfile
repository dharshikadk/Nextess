FROM node:22-alpine AS build

WORKDIR /app

COPY backend/package*.json ./backend/
COPY database/package*.json ./database/

RUN npm --prefix backend install
RUN npm --prefix database install

COPY backend ./backend
COPY database ./database

WORKDIR /app/backend
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nextess && adduser -S nextess -G nextess

COPY --from=build --chown=nextess:nextess /app/backend/package*.json ./backend/
COPY --from=build --chown=nextess:nextess /app/database ./database
COPY --from=build --chown=nextess:nextess /app/backend/dist ./backend/dist
COPY --from=build --chown=nextess:nextess /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
USER nextess

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --retries=6 CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node","dist/server.js"]
