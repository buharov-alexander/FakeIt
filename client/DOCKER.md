# Docker Deployment - Client

## Quick Start

### Build and Run
```bash
# Собрать образ
npm run docker:build

# Запустить контейнер
npm run docker:run

# Остановить контейнер
npm run docker:stop
```

### Manual Commands
```bash
# Собрать образ
docker build -t fakeit-client .

# Запустить контейнер
docker run -p 3000:3000 --name fakeit-client fakeit-client

# Остановить и удалить контейнер
docker stop fakeit-client && docker rm fakeit-client
```

## Features

### Multi-stage Build
- **Builder stage**: Устанавливает все зависимости и собирает Next.js
- **Runner stage**: Минимальный образ только с production зависимостями
- **Size optimization**: ~200MB final image size

### Security
- **Non-root user**: Запуск под пользователем `nodejs` (UID 1001)
- **Minimal attack surface**: Только необходимые пакеты
- **Alpine Linux**: Меньше уязвимостей

### Performance
- **Next.js production mode**: Оптимизированная сборка
- **Standalone mode**: Самодостаточный билд
- **Static assets**: Кэширование статических файлов

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Socket.io server URL |
| `NEXT_TELEMETRY_DISABLED` | `1` | Отключает телеметрию Next.js |

## Container Information

- **Base Image**: `node:20-alpine`
- **Exposed Port**: `3000`
- **Working Directory**: `/app`
- **User**: `nodejs` (UID 1001)
- **Command**: `node server.js`

## Development vs Production

| Feature | Development | Production (Docker) |
|----------|-------------|---------------------|
| Build tool | `next dev` | Pre-compiled |
| Hot reload | ✅ | ❌ |
| Dependencies | All packages | Production only |
| User | Current user | nodejs (non-root) |
| Optimizations | Development | Production optimizations |

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
docker run -p 3001:3000 fakeit-client
```

### Container Issues
```bash
# View logs
docker logs fakeit-client

# Access container shell
docker exec -it fakeit-client sh

# Check container status
docker ps -a | grep fakeit-client
```

### Build Issues
```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t fakeit-client .
```

### Connection Issues
```bash
# Check if server is running
curl http://localhost:3001/health

# Check socket connection
docker logs fakeit-client | grep -i socket
```

## Performance

### Image Size
- **Builder stage**: ~800MB (with dev dependencies)
- **Final image**: ~200MB (production only)
- **Reduction**: 75% smaller than development

### Startup Time
- **Cold start**: ~5 seconds
- **Memory usage**: ~150MB
- **CPU usage**: Minimal (idle)

### Runtime Performance
- **Static assets**: Оптимизированы и закэшированы
- **JavaScript**: Минифицирован и сжат
- **CSS**: Оптимизирован с Tailwind

## Monitoring

### Health Check
```bash
# Manual health check
curl http://localhost:3000

# Expected response: HTML page
```

### Resource Usage
```bash
# View container stats
docker stats fakeit-client

# View disk usage
docker system df
```

### Logs
```bash
# View application logs
docker logs -f fakeit-client

# View specific log levels
docker logs fakeit-client | grep ERROR
docker logs fakeit-client | grep WARN
```

## Integration with Server

### Docker Compose
```yaml
services:
  client:
    build: ./client
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SOCKET_URL=http://server:3001
    depends_on:
      - server
```

### Network Configuration
- **Internal**: Контейнеры могут общаться по имени сервиса
- **External**: Клиент доступен на `localhost:3000`
- **Socket.io**: Автоматическое подключение к серверу

## Production Tips

### Environment Setup
```bash
# Production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_SOCKET_URL=https://your-server.com
```

### Scaling
```bash
# Run multiple instances
docker run -d -p 3000:3000 --name client1 fakeit-client
docker run -d -p 3001:3000 --name client2 fakeit-client
```

### Load Balancer
Используйте nginx или другой load balancer для распределения трафика между несколькими контейнерами клиента.
