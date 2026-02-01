/**
 * 微信公众号配置解析
 */
import type { WechatMpChannelConfig, WechatMpAccountConfig, ResolvedWechatMpAccount } from "./types.js";
import * as fs from "fs";

const DEFAULT_ACCOUNT_ID = "default";
const DEFAULT_WEBHOOK_PATH = "/wemp";

interface MoltbotConfig {
  channels?: {
    "wemp"?: WechatMpChannelConfig;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * 列出所有账户 ID
 */
export function listWechatMpAccountIds(cfg: MoltbotConfig): string[] {
  const channelCfg = cfg.channels?.["wemp"];
  if (!channelCfg) return [];

  const ids: string[] = [];

  // 检查顶层配置
  if (channelCfg.appId) {
    ids.push(DEFAULT_ACCOUNT_ID);
  }

  // 检查 accounts
  if (channelCfg.accounts) {
    for (const accountId of Object.keys(channelCfg.accounts)) {
      if (!ids.includes(accountId)) {
        ids.push(accountId);
      }
    }
  }

  return ids.length > 0 ? ids : [DEFAULT_ACCOUNT_ID];
}

/**
 * 解析账户配置
 */
export function resolveWechatMpAccount(cfg: MoltbotConfig, accountId: string): ResolvedWechatMpAccount {
  const channelCfg = cfg.channels?.["wemp"] ?? {};
  const isDefault = accountId === DEFAULT_ACCOUNT_ID;

  let accountCfg: WechatMpAccountConfig;
  if (isDefault) {
    // 支持两种字段名：encodingAESKey 和 EncodingAESKey
    const aesKey = channelCfg.encodingAESKey ?? (channelCfg as any).EncodingAESKey;
    accountCfg = {
      enabled: channelCfg.enabled,
      appId: channelCfg.appId,
      appSecret: channelCfg.appSecret,
      appSecretFile: channelCfg.appSecretFile,
      token: channelCfg.token,
      encodingAESKey: aesKey,
      name: channelCfg.name,
      webhookPath: channelCfg.webhookPath,
    };
  } else {
    accountCfg = channelCfg.accounts?.[accountId] ?? {};
  }

  // 解析 appSecret
  let appSecret = accountCfg.appSecret ?? "";
  let secretSource: "config" | "file" | "env" | undefined;

  if (appSecret) {
    secretSource = "config";
  } else if (accountCfg.appSecretFile) {
    try {
      appSecret = fs.readFileSync(accountCfg.appSecretFile, "utf-8").trim();
      secretSource = "file";
    } catch {
      // ignore
    }
  } else if (isDefault) {
    // 尝试环境变量
    const envAppId = process.env.WECHAT_MP_APP_ID?.trim();
    const envSecret = process.env.WECHAT_MP_APP_SECRET?.trim();
    const envToken = process.env.WECHAT_MP_TOKEN?.trim();
    if (envAppId && envSecret) {
      if (!accountCfg.appId) accountCfg.appId = envAppId;
      appSecret = envSecret;
      if (!accountCfg.token && envToken) accountCfg.token = envToken;
      secretSource = "env";
    }
  }

  return {
    accountId,
    enabled: accountCfg.enabled ?? false,
    appId: accountCfg.appId ?? "",
    appSecret,
    token: accountCfg.token ?? "",
    encodingAESKey: accountCfg.encodingAESKey ?? "",
    name: accountCfg.name,
    webhookPath: accountCfg.webhookPath ?? DEFAULT_WEBHOOK_PATH,
    secretSource,
    config: accountCfg,
  };
}

/**
 * 应用账户配置
 */
export function applyWechatMpAccountConfig(
  cfg: MoltbotConfig,
  accountId: string,
  updates: Partial<WechatMpAccountConfig>
): MoltbotConfig {
  const isDefault = accountId === DEFAULT_ACCOUNT_ID;

  if (isDefault) {
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        "wemp": {
          ...cfg.channels?.["wemp"],
          enabled: true,
          ...updates,
        },
      },
    };
  } else {
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        "wemp": {
          ...cfg.channels?.["wemp"],
          enabled: true,
          accounts: {
            ...cfg.channels?.["wemp"]?.accounts,
            [accountId]: {
              ...cfg.channels?.["wemp"]?.accounts?.[accountId],
              enabled: true,
              ...updates,
            },
          },
        },
      },
    };
  }
}
