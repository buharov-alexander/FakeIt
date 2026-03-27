# Multi-stage build для оптимизации размера
FROM node:20-alpine AS deps

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci && npm cache clean --force

# Стадия сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем зависимости и исходный код
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

# Устанавливаем переменные окружения
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Собираем приложение
RUN npm run build

# Финальный образ - запускаем Next.js standalone
FROM node:20-alpine AS runner

# Создаем пользователя без прав для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только production зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем standalone приложение
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static

# Переключаемся на пользователя nodejs
USER nodejs

# Открываем порт
EXPOSE 3000

# Запускаем Next.js в production режиме
CMD ["node", "server.js"]
