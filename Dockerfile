# build stage
FROM node:lts AS build-stage
WORKDIR /app

# Copia de dependencias primero para aprovechar cache
COPY package.json package-lock.json* .
RUN npm install --ignore-scripts

# Copia del resto del código
COPY . .

# Preparar Quasar (postinstall manual) y compilar
RUN npx quasar prepare

# Variables de build (puedes sobreescribirlas con --build-arg)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
# Copiar build
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

# Nginx sirve en 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
