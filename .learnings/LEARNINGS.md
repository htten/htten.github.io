# Learnings

## [LRN-20260303-001] best_practice

**Logged**: 2026-03-03T00:40:00Z
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
MCP server web_search returned invalid links due to incorrect regex parsing

### Details
When implementing web_search for the MCP server, the regex matched the wrong `<a>` tag (icon link instead of title link). This resulted in:
1. Links like `https://cn.bing.com/search?q=...` (redirect URLs) instead of actual result URLs
2. Some links returning 403 (e.g., zhihu.com)

**Root cause**: HTML parsing grabbed first `<a href=...>` in result block, which was the site icon link, not the title link.

**Fix**: Changed regex to specifically match `<h2>` containing the title `<a>`:
```javascript
const titleMatch = block.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/);
```

### Suggested Action
1. When parsing HTML search results, always target the specific container (h2/a) not just any link
2. Test all returned URLs with curl -I before returning to user
3. Filter out known problematic domains (zhihu returns 403)

### Metadata
- Source: conversation
- Tags: mcp-server, web-search, html-parsing
- See Also: 

---
