# ETAPA 1: Construcción usando exactamente la versión que pide el proyecto
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build

# ETAPA 2: Servidor
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
