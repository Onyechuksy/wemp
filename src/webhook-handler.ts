/**
 * 微信公众号 Webhook 处理
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ResolvedWechatMpAccount, WechatMpMessage } from "./types.js";
import { verifySignature, processWechatMessage } from "./crypto.js";
import { sendTypingStatus } from "./api.js";
import { getWechatMpRuntime } from "./runtime.js";

// 注册的 webhook 目标
const webhookTargets = new Map<string, {
  account: ResolvedWechatMpAccount;
  cfg: any;
}>();

// 处理中的消息（防重复）
const processingMessages = new Set<string>();

/**
 * 注册 Webhook 目标
 */
export function registerWechatMpWebhookTarget(opts: {
  account: ResolvedWechatMpAccount;
  path: string;
  cfg: any;
}): () => void {
  const { account, path, cfg } = opts;
  webhookTargets.set(path, { account, cfg });
  console.log(`[wemp:${account.accountId}] Webhook registered at ${path}`);

  return () => {
    webhookTargets.delete(path);
    console.log(`[wemp:${account.accountId}] Webhook unregistered from ${path}`);
  };
}

/**
 * 从请求中解析路径
 */
function resolvePath(req: IncomingMessage): string {
  const url = new URL(req.url ?? "/", "http://localhost");
  return url.pathname || "/";
}

/**
 * 从请求中解析查询参数
 */
function resolveQueryParams(req: IncomingMessage): URLSearchParams {
  const url = new URL(req.url ?? "/", "http://localhost");
  return url.searchParams;
}

/**
 * 处理 Webhook 请求
 * 使用 (req, res) => Promise<boolean> 接口，与 Openclaw 的 HTTP handler 接口匹配
 */
export async function handleWechatMpWebhookRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const pathname = resolvePath(req);

  console.log(`[wemp] Received request: ${req.method} ${pathname}`);
  console.log(`[wemp] Registered targets: ${Array.from(webhookTargets.keys()).join(", ") || "none"}`);

  // 查找匹配的 webhook 目标
  const target = webhookTargets.get(pathname);
  if (!target) {
    // 也检查是否是 /wemp 开头的路径
    for (const [path, t] of webhookTargets) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        return handleRequest(req, res, t.account, t.cfg);
      }
    }
    console.log(`[wemp] No matching target for ${pathname}`);
    return false;
  }

  return handleRequest(req, res, target.account, target.cfg);
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  account: ResolvedWechatMpAccount,
  cfg: any
): Promise<boolean> {
  const queryParams = resolveQueryParams(req);
  const query = Object.fromEntries(queryParams);

  // GET 请求 - 服务器验证
  if (req.method === "GET") {
    const { signature, timestamp, nonce, echostr } = query;

    if (verifySignature(account.token, signature ?? "", timestamp ?? "", nonce ?? "")) {
      console.log(`[wemp:${account.accountId}] 服务器验证成功`);
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(echostr ?? "");
      return true;
    } else {
      console.warn(`[wemp:${account.accountId}] 服务器验证失败`);
      res.statusCode = 403;
      res.end("验证失败");
      return true;
    }
  }

  // POST 请求 - 接收消息
  if (req.method === "POST") {
    const rawBody = await readBody(req);

    const result = processWechatMessage(account, rawBody, query);
    if (!result.success || !result.message) {
      console.warn(`[wemp:${account.accountId}] ${result.error}`);
      res.statusCode = result.error?.includes("验证失败") ? 403 : 400;
      res.end(result.error ?? "Error");
      return true;
    }

    const msg = result.message;
    console.log(`[wemp:${account.accountId}] 收到消息: type=${msg.msgType}, from=${msg.fromUserName}`);

    // 立即返回 success，避免微信超时
    res.statusCode = 200;
    res.end("success");

    // 异步处理消息
    setImmediate(() => {
      handleMessage(account, msg, cfg).catch((err) => {
        console.error(`[wemp:${account.accountId}] 处理消息失败:`, err);
      });
    });

    return true;
  }

  res.statusCode = 405;
  res.end("Method Not Allowed");
  return true;
}

/**
 * 读取请求体
 */
async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      resolve(body);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * 处理微信消息
 */
async function handleMessage(
  account: ResolvedWechatMpAccount,
  msg: WechatMpMessage,
  cfg: any
): Promise<void> {
  const runtime = getWechatMpRuntime();
  if (!runtime) {
    console.error(`[wemp:${account.accountId}] Runtime not available`);
    return;
  }

  const openId = msg.fromUserName;
  const msgKey = `${openId}:${msg.msgId || msg.createTime}`;

  // 防重复处理
  if (processingMessages.has(msgKey)) {
    console.log(`[wemp:${account.accountId}] 跳过重复消息: ${msgKey}`);
    return;
  }
  processingMessages.add(msgKey);
  setTimeout(() => processingMessages.delete(msgKey), 30000);

  // 处理事件
  if (msg.msgType === "event") {
    await handleEvent(account, msg, runtime);
    return;
  }

  // 处理文本消息
  if (msg.msgType === "text" && msg.content) {
    // 发送正在输入状态
    sendTypingStatus(account, openId).catch(() => {});

    // 构建 inbound 消息
    const inbound = {
      channel: "wemp" as const,
      accountId: account.accountId,
      chatType: "direct" as const,
      chatId: openId,
      messageId: msg.msgId ?? `${msg.createTime}`,
      authorId: openId,
      authorName: openId,
      text: msg.content,
      timestamp: parseInt(msg.createTime) * 1000 || Date.now(),
      raw: msg,
    };

    // 调用 runtime 处理消息
    await runtime.handleInbound(inbound);
    return;
  }

  // 其他消息类型
  if (msg.msgType === "image" || msg.msgType === "voice" || msg.msgType === "video") {
    // 语音消息如果有识别结果，当作文本处理
    if (msg.msgType === "voice" && msg.recognition) {
      const inbound = {
        channel: "wemp" as const,
        accountId: account.accountId,
        chatType: "direct" as const,
        chatId: openId,
        messageId: msg.msgId ?? `${msg.createTime}`,
        authorId: openId,
        authorName: openId,
        text: msg.recognition,
        timestamp: parseInt(msg.createTime) * 1000 || Date.now(),
        raw: msg,
      };
      await runtime.handleInbound(inbound);
      return;
    }

    // 暂不支持的消息类型
    console.log(`[wemp:${account.accountId}] 暂不支持的消息类型: ${msg.msgType}`);
  }
}

/**
 * 处理事件
 */
async function handleEvent(
  account: ResolvedWechatMpAccount,
  msg: WechatMpMessage,
  runtime: any
): Promise<void> {
  const openId = msg.fromUserName;

  switch (msg.event) {
    case "subscribe":
      console.log(`[wemp:${account.accountId}] 用户关注: ${openId}`);
      // 可以发送欢迎消息
      break;

    case "unsubscribe":
      console.log(`[wemp:${account.accountId}] 用户取消关注: ${openId}`);
      break;

    default:
      console.log(`[wemp:${account.accountId}] 未处理的事件: ${msg.event}`);
  }
}
