/**
 * JSON-lines fallback store for offline writes.
 */
import { readFile, writeFile, appendFile, unlink, mkdir } from "fs/promises";
import { dirname } from "path";

export class FallbackStore {
  constructor(private filePath: string) {}

  async append(toolName: string, args: Record<string, unknown>): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), tool: toolName, args }) + "\n";
    await appendFile(this.filePath, line, "utf-8");
  }

  async read(): Promise<string> {
    try {
      return await readFile(this.filePath, "utf-8");
    } catch {
      return "";
    }
  }

  async drain(): Promise<Array<{ tool: string; args: Record<string, unknown> }>> {
    const content = await this.read();
    if (!content.trim()) return [];
    const items = content
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as { tool: string; args: Record<string, unknown> });
    await this.clear();
    return items;
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.filePath);
    } catch {
      // file may not exist
    }
  }
}
