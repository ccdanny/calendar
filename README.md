# 📅 Smart Work Calendar (智能工时日历)

一套专为中国职场设计的工时管理与自动打卡系统。支持法定节假日识别、加班登记、CSV 导出，以及基于 Mac 状态的“无感”下班打卡。

## 🌟 核心特性
- **中国节假日同步**：自动识别法定节假日与调休补班。
- **Mac 无感打卡**：通过 Hammerspoon 监听 Mac 睡眠/锁屏，合盖即打卡。
- **全栈私有化**：使用 Docker 部署，数据存储在本地 SQLite，安全受控。
- **异地灾备**：提供自动化脚本，支持将数据备份至 NAS 或异地服务器。
- **报表导出**：一键导出年度/月度加班工时统计。

---

## 🚀 部署指南 (Server)

### 1. 准备工作
确保你的服务器已安装 `Docker` 和 `Docker Compose`。

### 2. 启动服务
1. 将本项目上传至服务器。
2. 修改 `docker-compose.yml` 中的环境变量：
   - `API_SECRET`: 设置一个复杂的密钥（用于 Webhook 校验）。
3. 启动容器：
   ```bash
   cd my-calendar
   docker-compose up -d
   ```
4. 访问服务：`http://<服务器IP>:3000`

---

## ⌚ 自动化打卡配置 (macOS)

该功能利用 Mac 的状态变化触发下班时间上报。

1. **安装 Hammerspoon**：[官网下载](https://www.hammerspoon.org/)。
2. **配置脚本**：
   - 打开或创建 `~/.hammerspoon/init.lua`。
   - 拷贝本项目 `scripts/hammerspoon_init.lua` 中的内容。
   - **修改以下关键变量**：
     - `wifiName`: 你公司的 WiFi SSID 名称。
     - `secretKey`: 必须与服务器 `API_SECRET` 一致。
     - `apiEndpoint`: 你的服务器 API 地址（如 `http://1.2.3.4:3000/api/webhook/clock-out`）。
3. **启用**：在 Hammerspoon 菜单点击 `Reload Config`。

---

## 💾 数据备份 (NAS/Cloud)

数据库文件位于 `./data/calendar.db`。

1. **配置脚本**：修改 `scripts/backup.sh` 中的路径和 NAS 地址。
2. **设置定时任务**：
   ```bash
   crontab -e
   # 每天凌晨 3 点执行备份
   0 3 * * * /bin/bash /path/to/my-calendar/scripts/backup.sh
   ```

---

## 🛠️ 技术栈
- **Frontend**: React, Vite, Ant Design, chinese-days
- **Backend**: Node.js, Express, Prisma
- **Database**: SQLite
- **Automation**: Hammerspoon (Lua)

---

## 📝 常见问题 (FAQ)
- **Q: 为什么日历显示的节假日不准？**
  - A: 系统使用的是 `chinese-days` 库，请确保定期更新容器镜像以获取最新的法定假日数据。
- **Q: 中午锁屏会触发打卡吗？**
  - A: 默认脚本设置了 `hour >= 17` 才会触发，你可以在 `init.lua` 中根据需求调整。
- **Q: 数据库如何迁移？**
  - A: 只需拷贝整个 `data` 文件夹到新服务器即可。
