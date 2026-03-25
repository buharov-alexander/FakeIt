# Multi-stage build для оптимизации размера
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci && npm cache clean --force

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Финальный образ - используем Alpine для минимального размера
FROM node:20-alpine AS runner

# Создаем пользователя без прав для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только production зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем собранные файлы
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Переключаемся на пользователя nodejs
USER nodejs

# Открываем порт
EXPOSE 3001

# Запускаем приложение
CMD ["node", "dist/index.js"]
