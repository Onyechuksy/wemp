/**
 * 运行时上下文
 */
import type { OpenclawRuntime } from "openclaw/plugin-sdk";

let runtime: OpenclawRuntime | null = null;

export function setWechatMpRuntime(r: OpenclawRuntime) {
  runtime = r;
}

export function getWechatMpRuntime(): OpenclawRuntime | null {
  return runtime;
}
