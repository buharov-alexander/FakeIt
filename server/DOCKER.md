# Docker Deployment - Server

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
docker build -t fibbage-server .

# Запустить контейнер
docker run -p 3001:3001 --name fibbage-server fibbage-server

# Остановить и удалить контейнер
docker stop fibbage-server && docker rm fibbage-server
```

## Features

### Multi-stage Build
- **Builder stage**: Устанавливает все зависимости и собирает TypeScript
- **Runner stage**: Минимальный образ только с production зависимостями
- **Size optimization**: ~50MB final image size

### Security
- **Non-root user**: Запуск под пользователем `nodejs` (UID 1001)
- **Minimal attack surface**: Только необходимые пакеты
- **Alpine Linux**: Меньше уязвимостей

### Health Check
- **Endpoint**: `/health`
- **Response**: `{"status":"ok","timestamp":"..."}`
- **Usage**: `curl http://localhost:3001/health`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3001` | Server port |

## Container Information

- **Base Image**: `node:20-alpine`
- **Exposed Port**: `3001`
- **Working Directory**: `/app`
- **User**: `nodejs` (UID 1001)
- **Command**: `node dist/index.js`

## Development vs Production

| Feature | Development | Production (Docker) |
|----------|-------------|---------------------|
| Build tool | `tsx watch` | Pre-compiled |
| Restart | Auto-reload | Manual restart |
| Dependencies | All packages | Production only |
| User | Current user | nodejs (non-root) |

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
docker run -p 3002:3001 fibbage-server
```

### Container Issues
```bash
# View logs
docker logs fibbage-server

# Access container shell
docker exec -it fibbage-server sh

# Check container status
docker ps -a | grep fibbage-server
```

### Build Issues
```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t fibbage-server .
```

## Performance

### Image Size
- **Builder stage**: ~500MB (with dev dependencies)
- **Final image**: ~50MB (production only)
- **Reduction**: 90% smaller than development

### Startup Time
- **Cold start**: ~2 seconds
- **Memory usage**: ~50MB
- **CPU usage**: Minimal (idle)

## Monitoring

### Health Check
```bash
# Manual health check
curl http://localhost:3001/health

# Expected response
{"status":"ok","timestamp":"2026-03-25T10:32:58.263Z"}
```

### Resource Usage
```bash
# View container stats
docker stats fibbage-server

# View disk usage
docker system df
```
