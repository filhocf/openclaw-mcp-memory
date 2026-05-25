# AGENTS.md — openclaw-mcp-memory

## Project Overview

Plugin nativo OpenClaw que substitui o MCP server externo do mcp-memory-service por tools, hooks e storage embutidos no gateway. Provê memória persistente com busca híbrida (RRF), knowledge graph e mistake notes.

## Architecture

```
src/
├── index.ts                # Entry point — definePluginEntry
│   ├── register(tools)     # memory_store, search, forget, stats
│   ├── register(hooks)     # auto-recall, auto-capture, session-end
│   └── register(config)    # Schema de configuração
├── config.ts               # Leitura + defaults da config do plugin
├── types.d.ts              # Type stubs (SDK, SQLite, etc)
├── tools/
│   ├── memory-store.ts     # Armazenar fato (content, tags, type, metadata)
│   ├── memory-search.ts    # Busca híbrida RRF (BM25 + cosine similarity)
│   ├── memory-forget.ts    # Remover por content_hash
│   └── memory-stats.ts     # Estatísticas (total, por tipo, recentes)
├── hooks/
│   ├── auto-recall.ts      # before_prompt_build → injeta memórias no prompt
│   ├── auto-capture.ts     # after_tool_call → extrai fatos automaticamente
│   └── session-end.ts      # stop → consolida (dedup, stale)
└── storage/
    ├── sqlite.ts           # SQLite via better-sqlite3 (CRUD, BM25, vector, RRF)
    ├── embeddings.ts       # ONNX via @xenova/transformers (all-MiniLM-L6-v2)
    └── graph.ts            # Knowledge Graph (entidades + relações)
```

## Data Flow

```
Usuário → mensagem
  → [before_prompt_build] auto-recall: busca memórias relevantes → injeta no prompt
  → LLM processa com contexto de memória
  → [after_tool_call] auto-capture: extrai fatos → armazena no SQLite
  → Resposta → usuário
  → [stop] session-end: dedup + stale cleanup
```

## Key Conventions

- **Linguagem**: TypeScript ESM (`import`/`export`, sem `require`)
- **SDK**: `openclaw/plugin-sdk/*` (subpaths: plugin-entry, hooks, tool)
- **Storage**: better-sqlite3 síncrono (single-threaded, sem async no SQLite)
- **Embeddings**: ONNX via @xenova/transformers, modelo all-MiniLM-L6-v2
- **Busca**: RRF (Reciprocal Rank Fusion) — BM25 F4 + cosine similarity
- **IDs**: content_hash SHA-256 do conteúdo
- **Config**: Lida de `api.config` no register, defaults em `config.ts`
- **Logs**: `ctx.logger.info/warn/error` (não console.log)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)

## Adding a New Feature

1. Adicionar spec no CHANGELOG.md (próxima versão)
2. Criar ou modificar tool/hook em `src/tools/` ou `src/hooks/`
3. Se novo storage, adicionar em `src/storage/`
4. Exportar no `src/index.ts`
5. Testar com `vitest run`
6. Verificar lint com `eslint src/`
7. Commit + push

## Tests

```bash
vitest run              # Todos os testes
vitest --coverage       # Com cobertura
eslint src/             # Lint
```
