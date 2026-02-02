/**
 * 微信公众号数据统计 API
 * 用于获取公众号运营数据
 */
import { getAccessToken, safeFetch } from "../api.js";
import type { ResolvedWechatMpAccount } from "../types.js";
import { type Result, ok, err } from "../result.js";
import { DEFAULT_FETCH_TIMEOUT_MS } from "../constants.js";

const API_BASE = "https://api.weixin.qq.com";

// ============ 用户数据 ============

/**
 * 用户增减数据项
 */
export interface UserSummaryItem {
  refDate: string;
  userSource: number;
  newUser: number;
  cancelUser: number;
}

/**
 * 累计用户数据项
 */
export interface UserCumulateItem {
  refDate: string;
  cumulateUser: number;
}

/**
 * 获取用户增减数据
 * 最大跨度 7 天
 */
export async function getUserSummary(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<UserSummaryItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getusersummary?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        user_source: number;
        new_user: number;
        cancel_user: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      userSource: item.user_source,
      newUser: item.new_user,
      cancelUser: item.cancel_user,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 获取累计用户数据
 * 最大跨度 7 天
 */
export async function getUserCumulate(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<UserCumulateItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getusercumulate?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        cumulate_user: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      cumulateUser: item.cumulate_user,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

// ============ 图文数据 ============

/**
 * 图文群发数据项
 */
export interface ArticleSummaryItem {
  refDate: string;
  msgId: string;
  title: string;
  intPageReadUser: number;
  intPageReadCount: number;
  oriPageReadUser: number;
  oriPageReadCount: number;
  shareUser: number;
  shareCount: number;
  addToFavUser: number;
  addToFavCount: number;
}

/**
 * 获取图文群发每日数据
 * 最大跨度 1 天
 */
export async function getArticleSummary(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<ArticleSummaryItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getarticlesummary?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        msgid: string;
        title: string;
        int_page_read_user: number;
        int_page_read_count: number;
        ori_page_read_user: number;
        ori_page_read_count: number;
        share_user: number;
        share_count: number;
        add_to_fav_user: number;
        add_to_fav_count: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      msgId: item.msgid,
      title: item.title,
      intPageReadUser: item.int_page_read_user,
      intPageReadCount: item.int_page_read_count,
      oriPageReadUser: item.ori_page_read_user,
      oriPageReadCount: item.ori_page_read_count,
      shareUser: item.share_user,
      shareCount: item.share_count,
      addToFavUser: item.add_to_fav_user,
      addToFavCount: item.add_to_fav_count,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 图文阅读概况数据项
 */
export interface UserReadItem {
  refDate: string;
  intPageReadUser: number;
  intPageReadCount: number;
  oriPageReadUser: number;
  oriPageReadCount: number;
  shareUser: number;
  shareCount: number;
  addToFavUser: number;
  addToFavCount: number;
}

/**
 * 获取图文阅读概况数据
 * 最大跨度 3 天
 */
export async function getUserRead(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<UserReadItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getuserread?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        int_page_read_user: number;
        int_page_read_count: number;
        ori_page_read_user: number;
        ori_page_read_count: number;
        share_user: number;
        share_count: number;
        add_to_fav_user: number;
        add_to_fav_count: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      intPageReadUser: item.int_page_read_user,
      intPageReadCount: item.int_page_read_count,
      oriPageReadUser: item.ori_page_read_user,
      oriPageReadCount: item.ori_page_read_count,
      shareUser: item.share_user,
      shareCount: item.share_count,
      addToFavUser: item.add_to_fav_user,
      addToFavCount: item.add_to_fav_count,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 图文转发数据项
 */
export interface UserShareItem {
  refDate: string;
  shareScene: number;
  shareCount: number;
  shareUser: number;
}

/**
 * 获取图文转发概况数据
 * 最大跨度 7 天
 */
export async function getUserShare(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<UserShareItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getusershare?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        share_scene: number;
        share_count: number;
        share_user: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      shareScene: item.share_scene,
      shareCount: item.share_count,
      shareUser: item.share_user,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 图文总数据详情
 */
export interface ArticleTotalDetail {
  statDate: string;
  targetUser: number;
  intPageReadUser: number;
  intPageReadCount: number;
  oriPageReadUser: number;
  oriPageReadCount: number;
  shareUser: number;
  shareCount: number;
  addToFavUser: number;
  addToFavCount: number;
  intPageFromSessionReadUser: number;
  intPageFromSessionReadCount: number;
  intPageFromHistMsgReadUser: number;
  intPageFromHistMsgReadCount: number;
  intPageFromFeedReadUser: number;
  intPageFromFeedReadCount: number;
  intPageFromFriendsReadUser: number;
  intPageFromFriendsReadCount: number;
  intPageFromOtherReadUser: number;
  intPageFromOtherReadCount: number;
  feedShareFromSessionUser: number;
  feedShareFromSessionCnt: number;
  feedShareFromFeedUser: number;
  feedShareFromFeedCnt: number;
  feedShareFromOtherUser: number;
  feedShareFromOtherCnt: number;
}

/**
 * 图文总数据项
 */
export interface ArticleTotalItem {
  refDate: string;
  msgId: string;
  title: string;
  details: ArticleTotalDetail[];
}

/**
 * 获取图文群发总数据
 * 最大跨度 1 天
 */
export async function getArticleTotal(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<ArticleTotalItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getarticletotal?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        msgid: string;
        title: string;
        details: Array<{
          stat_date: string;
          target_user: number;
          int_page_read_user: number;
          int_page_read_count: number;
          ori_page_read_user: number;
          ori_page_read_count: number;
          share_user: number;
          share_count: number;
          add_to_fav_user: number;
          add_to_fav_count: number;
          int_page_from_session_read_user: number;
          int_page_from_session_read_count: number;
          int_page_from_hist_msg_read_user: number;
          int_page_from_hist_msg_read_count: number;
          int_page_from_feed_read_user: number;
          int_page_from_feed_read_count: number;
          int_page_from_friends_read_user: number;
          int_page_from_friends_read_count: number;
          int_page_from_other_read_user: number;
          int_page_from_other_read_count: number;
          feed_share_from_session_user: number;
          feed_share_from_session_cnt: number;
          feed_share_from_feed_user: number;
          feed_share_from_feed_cnt: number;
          feed_share_from_other_user: number;
          feed_share_from_other_cnt: number;
        }>;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      msgId: item.msgid,
      title: item.title,
      details: item.details.map(d => ({
        statDate: d.stat_date,
        targetUser: d.target_user,
        intPageReadUser: d.int_page_read_user,
        intPageReadCount: d.int_page_read_count,
        oriPageReadUser: d.ori_page_read_user,
        oriPageReadCount: d.ori_page_read_count,
        shareUser: d.share_user,
        shareCount: d.share_count,
        addToFavUser: d.add_to_fav_user,
        addToFavCount: d.add_to_fav_count,
        intPageFromSessionReadUser: d.int_page_from_session_read_user,
        intPageFromSessionReadCount: d.int_page_from_session_read_count,
        intPageFromHistMsgReadUser: d.int_page_from_hist_msg_read_user,
        intPageFromHistMsgReadCount: d.int_page_from_hist_msg_read_count,
        intPageFromFeedReadUser: d.int_page_from_feed_read_user,
        intPageFromFeedReadCount: d.int_page_from_feed_read_count,
        intPageFromFriendsReadUser: d.int_page_from_friends_read_user,
        intPageFromFriendsReadCount: d.int_page_from_friends_read_count,
        intPageFromOtherReadUser: d.int_page_from_other_read_user,
        intPageFromOtherReadCount: d.int_page_from_other_read_count,
        feedShareFromSessionUser: d.feed_share_from_session_user,
        feedShareFromSessionCnt: d.feed_share_from_session_cnt,
        feedShareFromFeedUser: d.feed_share_from_feed_user,
        feedShareFromFeedCnt: d.feed_share_from_feed_cnt,
        feedShareFromOtherUser: d.feed_share_from_other_user,
        feedShareFromOtherCnt: d.feed_share_from_other_cnt,
      })),
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

// ============ 消息数据 ============

/**
 * 消息发送数据项
 */
export interface UpstreamMsgItem {
  refDate: string;
  msgType: number;
  msgUser: number;
  msgCount: number;
}

/**
 * 获取消息发送概况数据
 * 最大跨度 7 天
 */
export async function getUpstreamMsg(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<UpstreamMsgItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getupstreammsg?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        msg_type: number;
        msg_user: number;
        msg_count: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      msgType: item.msg_type,
      msgUser: item.msg_user,
      msgCount: item.msg_count,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

/**
 * 消息分时数据项
 */
export interface UpstreamMsgHourItem {
  refDate: string;
  refHour: number;
  msgType: number;
  msgUser: number;
  msgCount: number;
}

/**
 * 获取消息发送分时数据
 * 最大跨度 1 天
 */
export async function getUpstreamMsgHour(
  account: ResolvedWechatMpAccount,
  beginDate: string,
  endDate: string
): Promise<Result<UpstreamMsgHourItem[]>> {
  try {
    const accessToken = await getAccessToken(account);
    const url = `${API_BASE}/datacube/getupstreammsghour?access_token=${accessToken}`;

    const response = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
    }, { timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });

    const data = await response.json() as {
      list?: Array<{
        ref_date: string;
        ref_hour: number;
        msg_type: number;
        msg_user: number;
        msg_count: number;
      }>;
      errcode?: number;
      errmsg?: string;
    };

    if (data.errcode && data.errcode !== 0) {
      return err(`${data.errcode} - ${data.errmsg}`);
    }

    const items = data.list?.map(item => ({
      refDate: item.ref_date,
      refHour: item.ref_hour,
      msgType: item.msg_type,
      msgUser: item.msg_user,
      msgCount: item.msg_count,
    })) || [];

    return ok(items);
  } catch (error) {
    return err(String(error));
  }
}

// ============ 辅助函数 ============

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 获取昨天的日期
 */
export function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

/**
 * 获取 N 天前的日期
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * 获取上周的日期范围
 */
export function getLastWeekRange(): { beginDate: string; endDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - dayOfWeek);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  return {
    beginDate: formatDate(lastMonday),
    endDate: formatDate(lastSunday),
  };
}
