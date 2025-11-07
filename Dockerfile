# Etapa de compilación
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar archivos e instalar dependencias
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copiar todo el código y compilar
COPY . .
RUN pnpm build

# Etapa final
FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

EXPOSE 3000
ENV NODE_ENV=production

CMD ["pnpm", "start"]
