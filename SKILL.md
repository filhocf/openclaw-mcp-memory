# MCP Memory Plugin for OpenClaw

Persistent memory with embedding-based semantic search for OpenClaw agents.

## Features

- **memory_store**: Store facts, lessons, decisions with automatic embeddings
- **memory_search**: Semantic search with RRF ranking
- **memory_forget**: Remove specific memories by hash
- **memory_stats**: Usage statistics and graph insights

## Hooks

- **auto-capture**: Automatically extracts facts from tool responses
- **auto-recall**: Injects relevant memories before prompts
- **session-end**: Summarizes session for long-term retention

## Configuration

```json
{
  "threshold": 0.7,
  "maxResults": 5,
  "autoCapture": true,
  "autoRecall": true,
  "graphEnabled": false,
  "captureMatcher": "*"
}
```

## Install

```bash
clawhub install @filhocf/openclaw-mcp-memory
```

After install, native deps (better-sqlite3, sharp) may need manual rebuild:
```bash
cd ~/.openclaw/extensions/mcp-memory && npm rebuild
```
