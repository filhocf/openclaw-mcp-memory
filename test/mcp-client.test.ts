import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('McpClient', () => {
  it('should import McpClient', async () => {
    const { McpClient } = await import('../src/storage/mcp-client.js');
    expect(McpClient).toBeDefined();
  });

  it('should construct with serviceUrl', async () => {
    const { McpClient } = await import('../src/storage/mcp-client.js');
    const client = new McpClient('http://127.0.0.1:3202/mcp');
    expect(client).toBeDefined();
  });

  it('should call memory_store via JSON-RPC', async () => {
    const { McpClient } = await import('../src/storage/mcp-client.js');
    const client = new McpClient('http://127.0.0.1:3202/mcp');
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { content: [{ text: '{"status":"stored"}' }] } }),
    });
    const result = await client.callTool('memory_store', { content: 'test', metadata: {} });
    expect(result).toBeDefined();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should return null on connection error (service offline)', async () => {
    const { McpClient } = await import('../src/storage/mcp-client.js');
    const client = new McpClient('http://127.0.0.1:9999/mcp');
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await client.callTool('memory_store', { content: 'test' });
    expect(result).toBeNull();
  });
});

describe('Fallback', () => {
  it('should import FallbackStore', async () => {
    const { FallbackStore } = await import('../src/storage/fallback.js');
    expect(FallbackStore).toBeDefined();
  });

  it('should append to fallback file on service failure', async () => {
    const { FallbackStore } = await import('../src/storage/fallback.js');
    const store = new FallbackStore('/tmp/test-fallback.md');
    await store.append('memory_store', { content: 'test memory' });
    const content = await store.read();
    expect(content).toContain('test memory');
    await store.clear();
  });

  it('should drain pending items', async () => {
    const { FallbackStore } = await import('../src/storage/fallback.js');
    const store = new FallbackStore('/tmp/test-fallback-drain.md');
    await store.append('memory_store', { content: 'item1' });
    await store.append('memory_store', { content: 'item2' });
    const items = await store.drain();
    expect(items.length).toBe(2);
    expect(items[0].args.content).toBe('item1');
    // After drain, file should be empty
    const remaining = await store.read();
    expect(remaining).toBe('');
    await store.clear();
  });
});
