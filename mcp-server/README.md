# OpenClaw MCP Server Configuration

## Quick Start

1. Install dependencies:
```bash
cd ~/.openclaw/workspace/mcp-server
npm install
```

2. Start the server:
```bash
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| OPENCLAW_URL | http://127.0.0.1:18789 | OpenClaw Gateway URL |
| OPENCLAW_TOKEN | (none) | Gateway auth token |

## Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "node",
      "args": ["/path/to/openclaw-mcp-server/server.js"],
      "env": {
        "OPENCLAW_URL": "http://127.0.0.1:18789",
        "OPENCLAW_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Zed Config

Add to `~/.config/zed/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "openclaw": {
        "command": "node",
        "args": ["/path/to/openclaw-mcp-server/server.js"],
        "env": {
          "OPENCLAW_URL": "http://127.0.0.1:18789"
        }
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| openclaw_message | Send message via Feishu/Telegram/Discord |
| openclaw_exec | Execute shell command |
| openclaw_read_file | Read file from workspace |
| openclaw_list_sessions | List active sessions |
| openclaw_browser_snapshot | Take browser snapshot |

## Extend

Add more tools by editing `server.js` and adding entries to the `tools` array.
