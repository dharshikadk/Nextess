FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
COPY database/package*.json ./database/

RUN npm --prefix backend install
RUN npm --prefix database install

COPY backend ./backend
COPY database ./database

WORKDIR /app/backend

RUN npm run prisma:generate

EXPOSE 4000

CMD ["npm", "run", "dev"]
