# 📅 Smart Work Calendar (智能工时日历)

一套专为中国职场设计的工时管理与自动打卡系统。支持法定节假日识别、加班登记、CSV 导出，以及基于 Mac 状态的“无感”下班打卡。

## 🌟 核心特性
- **中国节假日同步**：自动识别法定节假日与调休补班。
- **Mac 无感打卡**：通过 Hammerspoon 监听 Mac 睡眠/锁屏，合盖即打卡。
- **全栈私有化**：使用 Docker 部署，数据存储在本地 SQLite，安全受控。
- **异地灾备**：提供自动化脚本，支持将数据备份至 NAS 或异地服务器。
- **报表导出**：一键导出年度/月度加班工时统计。


## 🚀 启动方式

### 本地开发模式（默认）
```bash
npm start
# 或
node index.js
# 或
NODE_ENV=development node index.js
```

### 本地生产模式
```bash
npm run start:prod
# 或
NODE_ENV=production node index.js
```

### 开发模式（热重载）
```bash
npm run dev
```

## 🐳 容器中启动

### 使用 entrypoint.sh 脚本

**开发模式（默认）：**
```bash
./entrypoint.sh
# 或
./entrypoint.sh development
```

**生产模式：**
```bash
./entrypoint.sh production
# 或
./entrypoint.sh prod
```

### 使用 Docker 命令

**开发模式：**
```bash
docker run -e NODE_ENV=development your-image
# 或使用 entrypoint.sh
docker run your-image ./entrypoint.sh development
```

**生产模式：**
```bash
docker run -e NODE_ENV=production your-image
# 或使用 entrypoint.sh
docker run your-image ./entrypoint.sh production
```

### 使用 Docker Compose

在 `docker-compose.yml` 中设置：
```yaml
services:
  app:
    environment:
      - NODE_ENV=production
    # 或使用 entrypoint
    command: ["./entrypoint.sh", "production"]
```

### 注意事项

⚠️ **生产模式启动前，请确保已构建前端：**
```bash
npm run build
# 这会构建 client/dist 目录
```
