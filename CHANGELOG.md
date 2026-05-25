# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
