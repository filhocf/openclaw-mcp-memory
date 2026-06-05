# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-05

### Changed
- BREAKING: Replaced local SQLite + embeddings with thin HTTP client to mcp-memory-service
- Zero native dependencies (no sharp, better-sqlite3, @xenova/transformers)
- Plugin is now 100% portable — works on any platform without npm rebuild

### Added
- `src/storage/mcp-client.ts` — JSON-RPC 2.0 client for mcp-memory-service
- `src/storage/fallback.ts` — Offline fallback to MEMORY-FALLBACK.md
- `serviceUrl` config option (default: http://127.0.0.1:3202/mcp)

### Removed
- Local SQLite storage (better-sqlite3)
- Local embeddings (@xenova/transformers + sharp)
- Knowledge graph (moved to server-side)

## [0.1.0] — 2026-05-25

### Added
- Scaffold inicial: package.json, openclaw.plugin.json, tsconfig.json
- Entry point: definePluginEntry com register(tools + hooks)
- Tools: memory_store, memory_search (RRF), memory_forget, memory_stats
- Hooks: auto-recall (before_prompt_build), auto-capture (after_tool_call), session-end (stop)
- Storage: SQLite via better-sqlite3 (CRUD, BM25, busca vetorial)
- Embeddings: ONNX via @xenova/transformers (all-MiniLM-L6-v2)
- Knowledge Graph: entidades + relações em tabelas separadas
- Config: schema + leitura em runtime
- Documentação: AGENTS.md, CHANGELOG.md, LICENSE (MIT)
