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

## Lessons Learned (Plugin SDK)

### Runtime vs TypeScript

O SDK do OpenClaw aceita objetos que não passam no type checking estrito:
- Tools usam `execute()`, não `handler()` (AnyAgentTool vs Tool são tipos diferentes)
- registerHook exige terceiro argumento `opts.name`
- **Sempre inspecionar os logs do gateway** após carregar — TypeScript não pega esses erros

### ClawHub Publish

- Entry point deve ser `.js` compilado (TypeScript não é aceito)
- Versionar `dist/` no git (remover do .gitignore)
- v0.1.0 → v0.1.4: leve 4 tentativas até acertar todos os requisitos

### Native Dependencies

- better-sqlite3 e sharp precisam de `npm rebuild` após `clawhub install`
- O clawhub não roda scripts de pós-instalação para módulos nativos
- Dev deps problemáticas (@vitest/coverage-v8) quebram o npm install do clawhub — manter minimalistas

### Recomendação para Publicação

1. Testar instalando localmente antes de publicar (`clawhub pack` + copiar manualmente)
2. Verificar logs do gateway: `journalctl -u openclaw-gateway.service | grep -i mcp-memory`
3. Se usa módulo nativo, rodar `npm rebuild <pkg>` no diretório de extensão
4. Quality Gate deve incluir etapa de validação de instalação
