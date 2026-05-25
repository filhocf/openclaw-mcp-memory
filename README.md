# openclaw-mcp-memory

Native OpenClaw plugin for mcp-memory-service: persistent memory with hybrid search, knowledge graph, and mistake notes.

## Status

MVP em desenvolvimento.

## Estrutura

```
src/
├── index.ts              # Entry point (definePluginEntry)
├── hooks/
│   ├── auto-recall.ts    # before_prompt_build → injetar memórias
│   ├── auto-capture.ts   # after_tool_call → extrair fatos
│   └── session-end.ts    # stop → consolidar
├── tools/
│   ├── memory-store.ts   # Armazenar memória
│   ├── memory-search.ts  # Busca híbrida
│   ├── memory-forget.ts  # Remover memória
│   └── memory-stats.ts   # Estatísticas
└── storage/
    ├── sqlite.ts         # Adaptador SQLite
    ├── embeddings.ts     # Embeddings ONNX
    └── graph.ts          # Knowledge Graph
```

## Config

```json5
{
  plugins: {
    entries: {
      "mcp-memory": {
        enabled: true,
        config: {
          model: "local",
          threshold: 0.7,
          maxResults: 5,
          autoCapture: true,
          autoRecall: true,
        },
      },
    },
  },
}
```
