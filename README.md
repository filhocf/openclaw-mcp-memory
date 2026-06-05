# @filhocf/openclaw-mcp-memory

[![CI](https://github.com/filhocf/openclaw-mcp-memory/actions/workflows/ci.yml/badge.svg)](https://github.com/filhocf/openclaw-mcp-memory/actions/workflows/ci.yml)

Native OpenClaw plugin that connects to [mcp-memory-service](https://github.com/doobidoo/mcp-memory-service) for persistent memory. Acts as a thin HTTP client — zero native dependencies, no local SQLite or embeddings. All storage and search are handled server-side via JSON-RPC 2.0.

## Architecture

```
┌─────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│   OpenClaw  │──────▶│  Plugin (thin client) │──────▶│  mcp-memory-service │
│   Gateway   │◀──────│  JSON-RPC over HTTP   │◀──────│  (port 3202)        │
└─────────────┘       └──────────────────────┘       └─────────────────────┘
```

## Install

```bash
openclaw plugins install clawhub:@filhocf/openclaw-mcp-memory
```

## Prerequisites

- **mcp-memory-service** running on `http://127.0.0.1:3202/mcp`
- Node.js 22+

## Configuration

In your `openclaw.json`:

```json
{
  "plugins": {
    "@filhocf/openclaw-mcp-memory": {
      "serviceUrl": "http://127.0.0.1:3202/mcp",
      "autoRecall": true,
      "autoCapture": true,
      "maxResults": 5,
      "threshold": 0.7,
      "captureMatcher": "*"
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `serviceUrl` | `http://127.0.0.1:3202/mcp` | mcp-memory-service endpoint |
| `autoRecall` | `true` | Inject relevant memories before LLM reply |
| `autoCapture` | `true` | Store tool results as memories automatically |
| `maxResults` | `5` | Max memories returned per search |
| `threshold` | `0.7` | Minimum similarity score (0–1) |
| `captureMatcher` | `*` | Glob pattern for tools to capture |

## How It Works

1. **Auto-recall** (`before_prompt_build`): Before each LLM reply, searches memories relevant to the user prompt and injects them as context.
2. **Auto-capture** (`after_tool_call`): After any tool execution (matching `captureMatcher`), stores meaningful results as new memories.
3. **Session-end harvest** (`session_end`): Logs memory service stats on session close.

## Fallback

When mcp-memory-service is offline:

- Write operations are queued to `~/.openclaw/workspace/MEMORY-FALLBACK.md` (JSON-lines)
- On next startup, if the service is available, queued items are drained and sent
- Read operations return empty results gracefully

## Development

```bash
npm install
npx vitest run          # run tests
npx vitest run --coverage  # with coverage
npx tsc --noEmit        # type-check
npx eslint src/         # lint
```

## License

MIT
