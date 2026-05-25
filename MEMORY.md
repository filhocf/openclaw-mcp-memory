# MEMORY.md — openclaw-mcp-memory

## Sessão: 2026-05-25 — MVP Implementation

### Status
- ✅ Scaffold (package.json, manifest, tsconfig, entry point)
- ✅ 4 tools (store, search, forget, stats)
- ✅ 3 hooks (auto-recall, auto-capture, session-end)
- ✅ SQLite storage (CRUD, BM25, vector, RRF)
- ✅ Embeddings ONNX (all-MiniLM-L6-v2)
- ✅ Knowledge Graph
- ✅ AGENTS.md, CHANGELOG.md, LICENSE (MIT)
- ⬜ eslint config
- ⬜ vitest + tests
- ⬜ Publicação no ClawHub

### Próximos passos
1. Configurar eslint + vitest
2. Escrever testes unitários (storage, tools, hooks)
3. Publicar no ClawHub
4. Fase 2: Mistake Notes como tool nativa
5. Fase 3: Background consolidation + Web Dashboard

### Decisões
- **Storage**: better-sqlite3 síncrono (sem async) por simplicidade e performance
- **Embeddings**: ONNX local via @xenova/transformers (sem dependência externa)
- **Busca**: RRF combinando BM25 F4 + cosine similarity
- **IDs**: content_hash SHA-256 (determinístico, sem UUID)

### Referências
- Documento de projeto: `~/git/conhecimentos-de-ia/ferramentas/plugin-mcp-memory-openclaw.md`
- Repositório: `github.com/filhocf/openclaw-mcp-memory`
- SDK: `openclaw/plugin-sdk/*` (subpaths: plugin-entry, hooks, tool)
