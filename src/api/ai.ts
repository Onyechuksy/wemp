/**
 * 微信公众号 AI 能力 API
 * 用于翻译、语音识别等
 */
import { getAccessToken, safeFetch } from "../api.js";
import { DEFAULT_FETCH_TIMEOUT_MS } from "../constants.js";
import type { ResolvedWechatMpAccount } from "../types.js";
import { type Result, ok, err } from "../result.js";

const API_BASE = "https://api.weixin.qq.com";

/**
 * 微信翻译
 */
export async function translate(
  account: ResolvedWechatMpAccount,
  content: string,
  fromLang: string,
  toLang: string
): Promise<Result<{ fromContent: string; toContent: string }>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cgi-bin/media/voice/translatecontent?access_token=${accessToken}&lfrom=${fromLang}&lto=${toLang}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      from_content?: string;
      to_content?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok({
      fromContent: data.from_content || content,
      toContent: data.to_content || "",
    });
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 图片智能裁剪
 */
export async function aiCrop(
  account: ResolvedWechatMpAccount,
  imageUrl: string,
  ratios?: string[]
): Promise<Result<Array<{ cropLeft: number; cropTop: number; cropRight: number; cropBottom: number }>>> {
  try {
    const accessToken = await getAccessToken(account);
    let url = `${API_BASE}/cv/img/aicrop?access_token=${accessToken}&img_url=${encodeURIComponent(imageUrl)}`;
    if (ratios && ratios.length > 0) {
      url += `&ratios=${ratios.join(",")}`;
    }

    const response = await safeFetch(url, undefined, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });
    const data = await response.json() as {
      results?: Array<{
        crop_left: number;
        crop_top: number;
        crop_right: number;
        crop_bottom: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const results = data.results?.map(r => ({
      cropLeft: r.crop_left,
      cropTop: r.crop_top,
      cropRight: r.crop_right,
      cropBottom: r.crop_bottom,
    })) || [];

    return ok(results);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 图片超分辨率
 */
export async function superResolution(
  account: ResolvedWechatMpAccount,
  imageUrl: string
): Promise<Result<string>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/cv/img/superresolution?access_token=${accessToken}&img_url=${encodeURIComponent(imageUrl)}`;

    const response = await safeFetch(url, undefined, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });
    const data = await response.json() as {
      media_id?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    return ok(data.media_id || "");
  } catch (error) {
    return err(String(error));
  }
}
