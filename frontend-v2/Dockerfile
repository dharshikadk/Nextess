FROM node:22-alpine AS build

WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY frontend-v2/package*.json ./
RUN npm install
COPY frontend-v2 ./
RUN npm run build

FROM nginx:1.29-alpine AS runtime

COPY frontend-v2/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=6 CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["nginx","-g","daemon off;"]
