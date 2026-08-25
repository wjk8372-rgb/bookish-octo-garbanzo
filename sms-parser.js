// 短信解析模块
// 职责：从快递短信中正则提取 取件码 / 驿站 / 快递公司 / 收件手机号 / 地址 / 时间
// 设计思路：
//   1) 取件码：用一组触发词锚定 + 容忍 [A-Za-z0-9] 与可选连字符分段（如 8-2-1563、ABC12345、123456）
//   2) 驿站：优先用"凭/到/至/于/在"等动作词锚定 + 非贪婪，取【】外的真实站名；缺失时回退到【】内发件方（仅当含快递关键词）
//   3) 公司：用关键词字典命中（顺丰/京东/中通/圆通/申通/韵达/邮政/极兔/菜鸟/丰巢等）
//   4) 相关性判定：必须含取件码 或 (含快递关键词 且 命中真实站名后缀)，避免银行/营销短信误入库

'use strict';

// —— 正则规则 ——

// 取件码触发词
// 取件码本体：1+ 位字母数字，可有 0~3 个连字符分段（如 8-2-1563、ABC12345、123456、1-2-3456）
const CODE_PATTERN =
  /(?:取件码|取件号码|取件密码|提货码|取货码|凭码|凭此取件码|凭取件码|凭取件号码)[：:\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/;

// 驿站 / 自提柜 等代收点后缀
const STATION_SUFFIX = '驿站|快递柜|智能柜|自提柜|自提点|代收点|服务站|便利店|服务点|丰巢';

// 真实站名：在 到/至/于/在 等动作词之后，非贪婪到"XX驿站|XX柜..."
// 注意：不把"凭"作为站名锚点（"凭"几乎总在取件码前，会导致吞掉"取件码"）
// 非贪婪 *? 让捕获组从动作词后第一个字符开始取最短满足后缀的串
const STATION_BY_ANCHOR = new RegExp(
  `(?:到达|抵达|送达|到|至|于|在)[^。！,，；\\n]*?([\\u4e00-\\u9fa5A-Za-z0-9（）()]{2,24}(?:${STATION_SUFFIX}))`
);

// 【】内发件方（例：【菜鸟驿站】 / 【中通快递】）
const SENDER_PATTERN = /【([^】]+)】/;

// 地址：地址：XXX室/号/楼...
const ADDRESS_PATTERN = /地址[：:\s]*([^，。,；;\n]{4,40}(?:室|号|楼|栋|层|幢|号院|号铺))/;

// 手机号：11 位、1[3-9] 开头，前后不能是数字
const PHONE_PATTERN = /(?<!\d)(1[3-9]\d{9})(?!\d)/;

// 日期：X月X日 / 今日 / 明日 / YYYY-MM-DD
const DATE_PATTERN = /(\d{1,2}月\d{1,2}日|今日|明日|\d{4}-\d{1,2}-\d{1,2})/;

// 运单号：触发词"运单号/快递单号/单号"+ 8~30 位字母数字
// 长度 ≥ 8 可过滤"单号 1"等误命中；快递鸟运单号多为 10~15 位
const WAYBILL_PATTERN =
  /(?:运单号|快递单号|物流单号|单号)[：:\s#]*([A-Za-z0-9]{8,30})/;

// —— 快递公司关键词字典 ——
const COMPANY_RULES = [
  { name: '顺丰速运', keywords: ['顺丰', 'SF', 'SF-'] },
  { name: '京东快递', keywords: ['京东', 'JD'] },
  { name: '中通快递', keywords: ['中通', 'ZTO'] },
  { name: '圆通速递', keywords: ['圆通', 'YTO'] },
  { name: '申通快递', keywords: ['申通', 'STO'] },
  { name: '韵达快递', keywords: ['韵达', 'YUNDA'] },
  { name: '邮政EMS', keywords: ['EMS', '邮政', '中国邮政'] },
  { name: '极兔速递', keywords: ['极兔', 'J&T', 'JT'] },
  { name: '菜鸟驿站', keywords: ['菜鸟'] },
  { name: '丰巢', keywords: ['丰巢'] },
];

// 快递业务关键词（用于相关性判定）
const COURIER_KEYWORDS = [
  '快递', '取件', '取货', '包裹', '邮件', '驿站', '丰巢', '代收', '自提', '取件码', '提货',
];

/**
 * 解析一条短信
 * @param {string} smsText 短信原文
 * @returns {{ ok: boolean, error?: string, data?: object }}
 */
function parseSms(smsText) {
  if (!smsText || typeof smsText !== 'string' || !smsText.trim()) {
    return { ok: false, error: '短信内容为空' };
  }

  const result = {
    pickupCode: null,
    station: null,
    company: null,
    address: null,
    phone: null,
    date: null,
    waybill: null,
  };

  // 1) 取件码（要求捕获组总长 ≥ 4，过滤"码 12"这种过短误命中）
  const codeMatch = smsText.match(CODE_PATTERN);
  if (codeMatch && codeMatch[1].length >= 4) {
    result.pickupCode = codeMatch[1];
  }

  // 2) 真实站名（锚点版，优先）
  const anchorMatch = smsText.match(STATION_BY_ANCHOR);
  if (anchorMatch) {
    result.station = anchorMatch[1].trim();
  }

  // 3) 发件方（用于公司识别 + 站名回退）
  const senderMatch = smsText.match(SENDER_PATTERN);
  const sender = senderMatch ? senderMatch[1].trim() : null;

  // 站名回退：仅当真实站名未命中、且【】内含快递关键词或匹配公司关键词时采用
  if (!result.station && sender) {
    const isCourierSender =
      COURIER_KEYWORDS.some((kw) => sender.includes(kw)) ||
      COMPANY_RULES.some((r) => r.keywords.some((kw) => sender.includes(kw)));
    if (isCourierSender) result.station = sender;
  }

  // 4) 快递公司：关键词命中
  for (const rule of COMPANY_RULES) {
    if (rule.keywords.some((kw) => smsText.includes(kw))) {
      result.company = rule.name;
      break;
    }
  }

  // 5) 地址
  const addrMatch = smsText.match(ADDRESS_PATTERN);
  if (addrMatch) result.address = addrMatch[1].trim();

  // 6) 手机号
  const phoneMatch = smsText.match(PHONE_PATTERN);
  if (phoneMatch) result.phone = phoneMatch[1];

  // 7) 日期
  const dateMatch = smsText.match(DATE_PATTERN);
  if (dateMatch) result.date = dateMatch[1];

  // 8) 运单号
  const waybillMatch = smsText.match(WAYBILL_PATTERN);
  if (waybillMatch) result.waybill = waybillMatch[1];

  // —— 相关性判定 ——
  // 只要含快递业务关键词即视为快递短信（即使尚无取件码/驿站，如"快递正在派送中"也要入库，状态显示为在途中）
  const hasCourierKeyword = COURIER_KEYWORDS.some((kw) => smsText.includes(kw));
  if (!hasCourierKeyword) {
    return { ok: false, error: '非快递短信（无快递业务关键词）' };
  }

  return { ok: true, data: result };
}

module.exports = { parseSms, COMPANY_RULES };
