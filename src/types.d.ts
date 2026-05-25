/**
 * Local type declarations for OpenClaw Plugin SDK modules.
 * At runtime these are provided by the OpenClaw gateway.
 */
declare module "openclaw/plugin-sdk/plugin-entry" {
  import type { PluginApi } from "openclaw/plugin-sdk/api";
  export function definePluginEntry(opts: {
    id: string;
    register: (api: PluginApi) => void;
    unregister?: () => void;
  }): { id: string; register: (api: PluginApi) => void; unregister?: () => void };
}

declare module "openclaw/plugin-sdk/tool" {
  export interface ToolHandlerContext {
    logger: {
      info: (msg: string, ...args: unknown[]) => void;
      warn: (msg: string, ...args: unknown[]) => void;
      error: (msg: string, ...args: unknown[]) => void;
    };
    [key: string]: unknown;
  }

  export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (args: Record<string, unknown>, ctx: ToolHandlerContext) => Promise<Record<string, unknown>>;
  }
}

declare module "openclaw/plugin-sdk/hooks" {
  export type HookHandler<T extends string> = (...args: any[]) => void | Promise<void>;
}

declare module "openclaw/plugin-sdk/api" {
  export interface PluginApi {
    logger: {
      info: (msg: string, ...args: unknown[]) => void;
      warn: (msg: string, ...args: unknown[]) => void;
      error: (msg: string, ...args: unknown[]) => void;
    };
    config?: Record<string, unknown>;
    registerTool: (tool: import("openclaw/plugin-sdk/tool").Tool) => void;
    registerHook: (event: string, handler: (...args: any[]) => void | Promise<void>) => void;
    [key: string]: unknown;
  }
}
