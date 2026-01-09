-- ~/.hammerspoon/init.lua

local wifiName = "YOUR_WIFI_NAME"
local secretKey = "your_secret_key_here"
local apiEndpoint = "https://yourdomain.com/api/webhook/clock-out" -- 修改为你的服务器地址

function clockOut()
    local currentWifi = hs.wifi.currentNetwork()
    local hour = os.date("*t").hour

    -- 1. 检查是否在公司 WiFi
    if currentWifi == wifiName then
        -- 2. 检查是否在下班时间段 (例如 17点以后)
        if hour >= 17 then
           local body = hs.json.encode({
               timestamp = os.time(),
               device = "MacBook"
           })
           local headers = {
               ["x-secret-key"] = secretKey,
               ["Content-Type"] = "application/json"
           }
           
           -- 方案1: 使用系统代理（默认行为）
           hs.http.asyncPost(apiEndpoint, body, headers, function(status, body, headers)
               if status == 200 then
                   hs.notify.new({title="打卡成功", informativeText="下班时间已自动同步至日历"}):send()
               else
                   hs.notify.new({title="打卡失败", informativeText="状态码: " .. status}):send()
               end
           end)
        end
    end
end

-- 监听系统事件
watcher = hs.caffeinate.watcher.new(function(eventType)
    -- systemWillSleep: 合盖/睡眠
    -- screensDidLock: 锁屏 (Cmd+Ctrl+Q)
    if (eventType == hs.caffeinate.watcher.systemWillSleep) or
       (eventType == hs.caffeinate.watcher.screensDidLock) then
        clockOut()
    end
end)

watcher:start()
hs.notify.new({title="自动打卡脚本", informativeText="服务已启动"}):send()
