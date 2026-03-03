#!/usr/bin/env node

/**
 * OpenClaw MCP Server v2.4 - With Search (Fixed)
 * 
 * Features: Web Search (Bing), WeChat fetch, Web fetch
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TIMEOUT = 20;

const tools = [
  {
    name: 'web_search',
    description: 'Web search using Bing (free, no API key needed)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        maxResults: { type: 'number', description: 'Max results (default: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'wechat_fetch',
    description: 'Fetch WeChat article (optimized: textise.net -> jina.ai)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'WeChat article URL' },
        maxLength: { type: 'number', description: 'Max chars (default: 5000)' },
        saveTo: { type: 'string', description: 'Save to file path' },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch any webpage via jina.ai',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string' }, maxLength: { type: 'number' } },
      required: ['url'],
    },
  },
  {
    name: 'openclaw_exec',
    description: 'Execute shell command',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string' }, timeout: { type: 'number' } },
      required: ['command'],
    },
  },
  {
    name: 'openclaw_read_file',
    description: 'Read file',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'openclaw_write_file',
    description: 'Write file',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'openclaw_list_files',
    description: 'List directory',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'save_to_memory',
    description: 'Save to memory/notes',
    inputSchema: {
      type: 'object',
      properties: { filename: { type: 'string' }, content: { type: 'string' }, title: { type: 'string' } },
      required: ['filename', 'content'],
    },
  },
];

function fetchWechat(url, timeout = DEFAULT_TIMEOUT) {
  const encodedUrl = encodeURIComponent(url);
  const fetchUrl = `https://r.jina.ai/http://textise.net/showtext.aspx?strURL=${encodedUrl}`;
  
  try {
    const result = execSync(`curl -s -m ${timeout} "${fetchUrl}"`, {
      encoding: 'utf-8',
      maxBuffer: 200000,
    });
    
    if (result.includes('环境异常') || result.includes('验证码') || result.includes('CAPTCHA') || result.includes('blocked')) {
      return { success: false, error: 'Verification required', solution: 'Open article in browser manually' };
    }
    
    return { success: true, content: result };
  } catch (e) {
    return { success: false, error: e.message, solution: 'Try again or use manual method' };
  }
}

function handleToolCall(toolName, args) {
  const timeout = args.timeout || DEFAULT_TIMEOUT;
  
  switch (toolName) {
    case 'web_search': {
      const query = encodeURIComponent(args.query);
      const maxResults = args.maxResults || 5;
      const url = `https://cn.bing.com/search?q=${query}`;
      
      try {
        const html = execSync(`curl -s -m ${timeout} -L "${url}"`, { encoding: 'utf-8', maxBuffer: 100000 });
        
        const results = [];
        const algoBlocks = html.split('<li class="b_algo"');
        
        for (const block of algoBlocks.slice(1)) {
          if (results.length >= maxResults) break;
          
          // Extract title and link from h2 > a
          const titleMatch = block.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/);
          const descMatch = block.match(/<p[^>]*>([^<]+)<\/p>/);
          
          if (titleMatch) {
            const link = titleMatch[1];
            // Extract just the text content from title, removing any HTML
            const titleText = titleMatch[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
            const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').slice(0, 200) : '';
            
            // Skip internal bing links
            if (link && titleText && !link.includes('bing.com') && !link.includes('microsoft.com') && !link.includes('zhihu.com')) {
              results.push({ title: titleText, link, description });
            }
          }
        }
        
        return { content: [{ type: 'text', text: JSON.stringify({ query: args.query, count: results.length, results }, null, 2) }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Search error: ${e.message}` }], isError: true };
      }
    }

    case 'wechat_fetch': {
      const url = args.url;
      const isWechat = url.includes('weixin.qq.com') || url.includes('mp.weixin.qq.com');
      
      if (!isWechat) {
        return { content: [{ type: 'text', text: 'URL must be from weixin.qq.com or mp.weixin.qq.com' }], isError: true };
      }
      
      const result = fetchWechat(url, timeout);
      
      if (!result.success) {
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: true };
      }
      
      let content = result.content;
      const maxLength = args.maxLength || 5000;
      
      if (args.saveTo) {
        try {
          const dir = dirname(args.saveTo);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          writeFileSync(args.saveTo, content, 'utf-8');
        } catch {}
      }
      
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, url, content: content.slice(0, maxLength), savedTo: args.saveTo || null }, null, 2) }] };
    }

    case 'web_fetch': {
      try {
        const result = execSync(`curl -s -m ${timeout} "https://r.jina.ai/${args.url}"`, { encoding: 'utf-8', maxBuffer: (args.maxLength || 5000) * 3 });
        return { content: [{ type: 'text', text: result.slice(0, args.maxLength || 5000) }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
      }
    }

    case 'openclaw_exec': {
      try {
        return { content: [{ type: 'text', text: execSync(args.command, { encoding: 'utf-8', timeout: timeout * 1000 }) }] };
      } catch (e) { return { content: [{ type: 'text', text: e.message }], isError: true }; }
    }

    case 'openclaw_read_file': {
      try { return { content: [{ type: 'text', text: readFileSync(args.path, 'utf-8') }] }; }
      catch (e) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
    }

    case 'openclaw_write_file': {
      try { writeFileSync(args.path, args.content, 'utf-8'); return { content: [{ type: 'text', text: `Saved to ${args.path}` }] }; }
      catch (e) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
    }

    case 'openclaw_list_files': {
      try { return { content: [{ type: 'text', text: execSync(`ls -la "${args.path}"`, { encoding: 'utf-8' }) }] }; }
      catch (e) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
    }

    case 'save_to_memory': {
      const memoryPath = `${process.env.OPENCLAW_WORKSPACE || __dirname + '/../workspace'}/memory/${args.filename}`;
      try {
        const dir = dirname(memoryPath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        let content = args.title ? `# ${args.title}\n\n${args.content}` : args.content;
        if (existsSync(memoryPath)) content = '\n\n---\n\n' + content;
        writeFileSync(memoryPath, content, { flag: 'a' });
        return { content: [{ type: 'text', text: `Saved to memory/${args.filename}` }] };
      } catch (e) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

class OpenClawMCPServer {
  constructor() {
    this.server = new Server({ name: 'openclaw-mcp', version: '2.4.0' }, { capabilities: { tools: {} } });
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try { return handleToolCall(request.params.name, request.params.arguments); }
      catch (e) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
    });
  }
  async start() { await this.server.connect(new StdioServerTransport()); console.error('OpenClaw MCP v2.4 started'); }
}

new OpenClawMCPServer().start().catch(console.error);
