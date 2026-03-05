# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

## 模型验证

- 验证模型可用性时，先检查 API Key 类型/权限
- 对于已知的受限 Key（如 Coding Plan），标记为"配置存在但需要特定权限"
- 不要假设模型"可用"直到实际调用成功

## 防火墙命令

- firewall-cmd rich-rule 正确语法：`port port="22" protocol="tcp"`（元素+属性格式）

## MCP Server 开发

### 测试搜索结果
- 返回链接前用 `curl -I` 验证状态码
- 排除返回 403/500 的域名（如 zhihu.com）
- 解析 HTML 时要匹配特定容器（h2 > a），不要匹配第一个链接

### 配置位置
- mcporter 配置：`~/.config/mcporter.json` 或 `~/.openclaw/workspace/config/mcporter.json`
- MCP server 代码：`~/.openclaw/workspace/mcp-server/server.js`

---

Add whatever helps you do your job. This is your cheat sheet.

## GitHub 访问问题

### HTTPS 被阻，SSH 可用
- 症状：curl https://github.com 超时，但 ping 正常
- 解决：使用 SSH 协议代替 HTTPS
  ```bash
  # 错误
  git clone https://github.com/...
  
  # 正确
  git clone git@github.com:...
  ```

### SSH 密钥添加后首次可能超时
- 添加公钥后，等待几秒再试
- 或重启 Gateway
