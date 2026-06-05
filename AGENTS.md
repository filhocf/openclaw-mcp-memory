# AGENTS.md

## Project Overview

**openclaw-mcp-memory** is a thin HTTP client plugin for OpenClaw that delegates all memory operations (store, search, delete, stats) to an external `mcp-memory-service` via JSON-RPC 2.0 over HTTP. Zero native dependencies — no SQLite, no embeddings, no sharp.

## Architecture

```
src/
├── index.ts                  # Plugin entry — registers tools + hooks
├── config.ts                 # PluginConfig schema + defaults
├── glob.ts                   # Simple glob matcher for captureMatcher
├── types.d.ts                # OpenClaw plugin SDK type declarations
├── storage/
│   ├── mcp-client.ts         # JSON-RPC 2.0 HTTP client (callTool, isAvailable)
│   └── fallback.ts           # Offline queue (append/drain JSON-lines file)
├── tools/
│   ├── memory-store.ts       # memory_store tool
│   ├── memory-search.ts      # memory_search tool
│   ├── memory-forget.ts      # memory_forget tool
│   └── memory-stats.ts       # memory_stats tool
└── hooks/
    ├── auto-recall.ts        # before_prompt_build — inject relevant memories
    ├── auto-capture.ts       # after_tool_call — store tool results
    └── session-end.ts        # session_end — log stats

test/
├── mcp-client.test.ts        # McpClient + FallbackStore unit tests
├── tools.test.ts             # Tool execute() with mocked client
├── hooks.test.ts             # Hook handlers with mocked client
└── fallback.test.ts          # FallbackStore isolation tests
```

## Data Flow

```
User message
  → [before_prompt_build] auto-recall: search memories → inject context
    → LLM generates response (may call tools)
      → [after_tool_call] auto-capture: store tool result as memory
        → Response sent to user
          → [session_end] log stats
```

## Key Conventions

- **No native dependencies** — plugin must install without `npm rebuild`
- **All storage via HTTP** — mcp-memory-service handles SQLite + embeddings
- **Fallback on failure** — any write that fails goes to MEMORY-FALLBACK.md; drains on reconnect
- **Graceful degradation** — read failures return empty results, never throw
- **Thin client** — no business logic beyond argument mapping and fallback

## Adding a New Tool

1. Copy `src/tools/memory-store.ts`
2. Change `name`, `description`, `parameters`
3. Map args and call `client.callTool("server_tool_name", mappedArgs)`
4. Handle `null` return (service offline) → fallback or empty response
5. Export from new file, register in `src/index.ts`

## Tests

- Framework: **Vitest** (globals mode, Node environment)
- Pattern: mock `global.fetch` or pass a mock `McpClient` object
- Run: `npx vitest run` or `npx vitest run --coverage`
- Config: `vitest.config.ts` — includes `test/**/*.test.ts`
