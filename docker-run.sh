#!/bin/bash

# 构建镜像
docker build -t calendar:latest .

# 运行容器（等价于 docker-compose.yml 配置）
docker run -d \
  --name calendar-app \
  -p 8080:8080 \
  -v "$(pwd)/data:/app/data" \
  -e DATABASE_URL=file:/app/data/calendar.db \
  -e API_SECRET=change_me_to_a_secure_random_string \
  -e NODE_ENV=production \
  --restart unless-stopped \
  calendar:latest
