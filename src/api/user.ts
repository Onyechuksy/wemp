/**
 * 微信公众号用户管理 API
 * 用于获取和管理用户信息
 */
import { getAccessToken, safeFetch } from "../api.js";
import { DEFAULT_FETCH_TIMEOUT_MS } from "../constants.js";
import type { ResolvedWechatMpAccount } from "../types.js";
import { type Result, ok, err } from "../result.js";

const API_BASE = "https://api.weixin.qq.com";

/**
 * 用户信息
 */
export interface UserInfo {
  openId: string;
  unionId?: string;
  nickname: string;
  sex: 0 | 1 | 2;
  city: string;
  province: string;
  country: string;
  headImgUrl: string;
  subscribeTime: number;
  subscribe: number;
  remark: string;
  groupId: number;
  tagIds: number[];
  subscribeScene: string;
  qrScene: number;
  qrSceneStr: string;
}

/**
 * 获取用户基本信息
 */
export async function getUserInfo(
  account: ResolvedWechatMpAccount,
  openId: string,
  lang: "zh_CN" | "zh_TW" | "en" = "zh_CN"
): Promise<Result<UserInfo>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/user/info?access_token=${accessToken}&openid=${openId}&lang=${lang}`;

    const response = await safeFetch(url, undefined, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });
    const data = await response.json() as {
      subscribe?: number;
      openid?: string;
      unionid?: string;
      nickname?: string;
      sex?: number;
      city?: string;
      province?: string;
      country?: string;
      headimgurl?: string;
      subscribe_time?: number;
      remark?: string;
      groupid?: number;
      tagid_list?: number[];
      subscribe_scene?: string;
      qr_scene?: number;
      qr_scene_str?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok({
      openId: data.openid || openId,
      unionId: data.unionid,
      nickname: data.nickname || "",
      sex: (data.sex || 0) as 0 | 1 | 2,
      city: data.city || "",
      province: data.province || "",
      country: data.country || "",
      headImgUrl: data.headimgurl || "",
      subscribeTime: data.subscribe_time || 0,
      subscribe: data.subscribe || 0,
      remark: data.remark || "",
      groupId: data.groupid || 0,
      tagIds: data.tagid_list || [],
      subscribeScene: data.subscribe_scene || "",
      qrScene: data.qr_scene || 0,
      qrSceneStr: data.qr_scene_str || "",
    });
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 批量获取用户信息
 * 每次最多 100 个
 */
export async function batchGetUserInfo(
  account: ResolvedWechatMpAccount,
  openIds: string[],
  lang: "zh_CN" | "zh_TW" | "en" = "zh_CN"
): Promise<Result<UserInfo[]>> {
  try {
    if (openIds.length > 100) {
      return err("每次最多获取 100 个用户信息");
    }

    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/user/info/batchget?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_list: openIds.map(openid => ({ openid, lang })),
      }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      user_info_list?: Array<{
        subscribe: number;
        openid: string;
        unionid?: string;
        nickname: string;
        sex: number;
        city: string;
        province: string;
        country: string;
        headimgurl: string;
        subscribe_time: number;
        remark: string;
        groupid: number;
        tagid_list: number[];
        subscribe_scene: string;
        qr_scene: number;
        qr_scene_str: string;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const users = data.user_info_list?.map(u => ({
      openId: u.openid,
      unionId: u.unionid,
      nickname: u.nickname || "",
      sex: (u.sex || 0) as 0 | 1 | 2,
      city: u.city || "",
      province: u.province || "",
      country: u.country || "",
      headImgUrl: u.headimgurl || "",
      subscribeTime: u.subscribe_time || 0,
      subscribe: u.subscribe || 0,
      remark: u.remark || "",
      groupId: u.groupid || 0,
      tagIds: u.tagid_list || [],
      subscribeScene: u.subscribe_scene || "",
      qrScene: u.qr_scene || 0,
      qrSceneStr: u.qr_scene_str || "",
    })) || [];

    return ok(users);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 获取关注者列表
 */
export async function getFollowers(
  account: ResolvedWechatMpAccount,
  nextOpenId?: string
): Promise<Result<{ total: number; count: number; openIds: string[]; nextOpenId?: string }>> {
  try {
    const accessToken = await getAccessToken(account);
    let url = `${API_BASE}/cgi-bin/user/get?access_token=${accessToken}`;
    if (nextOpenId) {
      url += `&next_openid=${nextOpenId}`;
    }

    const response = await safeFetch(url, undefined, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });
    const data = await response.json() as {
      total?: number;
      count?: number;
      data?: { openid: string[] };
      next_openid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok({
      total: data.total || 0,
      count: data.count || 0,
      openIds: data.data?.openid || [],
      nextOpenId: data.next_openid,
    });
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 设置用户备注名
 */
export async function setUserRemark(
  account: ResolvedWechatMpAccount,
  openId: string,
  remark: string
): Promise<Result<void>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/user/info/updateremark?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openid: openId, remark }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as { errcode?: number; errmsg?: string };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(String(error));
  }
}

// ============ 黑名单管理 ============

/**
 * 获取黑名单列表
 */
export async function getBlacklist(
  account: ResolvedWechatMpAccount,
  beginOpenId?: string
): Promise<Result<{ total: number; count: number; openIds: string[]; nextOpenId?: string }>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/tags/members/getblacklist?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_openid: beginOpenId || "" }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      total?: number;
      count?: number;
      data?: { openid: string[] };
      next_openid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok({
      total: data.total || 0,
      count: data.count || 0,
      openIds: data.data?.openid || [],
      nextOpenId: data.next_openid,
    });
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 拉黑用户
 */
export async function batchBlacklistUsers(
  account: ResolvedWechatMpAccount,
  openIds: string[]
): Promise<Result<void>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/tags/members/batchblacklist?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openid_list: openIds }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as { errcode?: number; errmsg?: string };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 取消拉黑
 */
export async function batchUnblacklistUsers(
  account: ResolvedWechatMpAccount,
  openIds: string[]
): Promise<Result<void>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/tags/members/batchunblacklist?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openid_list: openIds }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as { errcode?: number; errmsg?: string };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(String(error));
  }
}
