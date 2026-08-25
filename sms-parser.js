const PICKUP_PATTERNS = [
  /取件码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
  /凭码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
  /取件号码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
  /取件密码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
  /提货码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
];
const WAYBILL_PATTERNS = [
  /运单号[:：\s]*([A-Za-z0-9]{8,30})/,
  /快递单号[:：\s]*([A-Za-z0-9]{8,30})/,
  /物流单号[:：\s]*([A-Za-z0-9]{8,30})/,
  /单号[:：\s]*([A-Za-z0-9]{8,30})/,
];
const STATION_ANCHORS = ['到达', '抵达', '送达', '投递至', '送到', '至', '于', '在'];
const COMPANY_KW = [
  { name: '顺丰速运', words: ['顺丰速运', '顺丰快递', '顺丰'] },
  { name: '京东快递', words: ['京东物流', '京东快递', 'JD', '京东'] },
  { name: '中通快递', words: ['中通快递', '中通快运', '中通'] },
  { name: '圆通速递', words: ['圆通速递', '圆通快递', '圆通'] },
  { name: '申通快递', words: ['申通快递', '申通'] },
  { name: '韵达快递', words: ['韵达快递', '韵达速递', '韵达'] },
  { name: '邮政EMS', words: ['中国邮政', 'EMS', '邮政速递', '邮政EMS', '邮政'] },
  { name: '极兔速递', words: ['极兔速递', '极兔快递', '极兔'] },
  { name: '菜鸟驿站', words: ['菜鸟驿站', '菜鸟裹裹', '菜鸟'] },
  { name: '丰巢', words: ['丰巢快递柜', '丰巢智能柜', '丰巢'] },
];
const BUSINESS_KW = ['快递', '取件', '驿站', '包裹', '快件', '派送', '运单', '派件员', '签收', '揽收', '投递', '丰巢', '菜鸟', '韵达', '顺丰', '京东', '中通', '圆通', '申通', '邮政', '极兔'];

function extractPickupCode(content) {
  for (const re of PICKUP_PATTERNS) {
    const m = content.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function extractWaybill(content) {
  for (const re of WAYBILL_PATTERNS) {
    const m = content.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function extractStation(content) {
  for (const anchor of STATION_ANCHORS) {
    const i = content.indexOf(anchor);
    if (i < 0) continue;
    const rest = content.slice(i + anchor.length);
    const m = rest.match(/^(.+?)(?:取件|凭码|，|。|！|\s{2}|$)/);
    if (m && m[1]) {
      let s = m[1].trim();
      s = s.replace(/^[：:\s]+/, '').replace(/[，,。！!]+$/, '').trim();
      if (s.length >= 2 && s.length <= 40) return s;
    }
  }
  const bracket = content.match(/【(.+?)】/);
  if (bracket && bracket[1]) {
    const s = bracket[1].trim();
    if (COMPANY_KW.some(c => c.words.some(w => s.includes(w)))) return s;
  }
  return null;
}

function extractCompany(content) {
  for (const c of COMPANY_KW) {
    if (c.words.some(w => content.includes(w))) return c.name;
  }
  return null;
}

function extractAddress(content) {
  const m = content.match(/地址[:：]\s*([^\n，。]{3,60})/);
  if (m && m[1]) return m[1].trim();
  return null;
}

function extractPhone(content) {
  const m = content.match(/\b(1[3-9]\d{9})\b/);
  return m ? m[1] : null;
}

function extractDate(content) {
  const m = content.match(/(\d{1,2}[-\/月]\d{1,2}[日号]?\s*\d{1,2}[:：]\d{1,2})/);
  if (m) return m[1];
  return null;
}

function isRelevant(content) {
  if (/验证码|校验码|银行|转账|还款|信用卡|贷款|营销|优惠|活动|红包|广告/.test(content)) return false;
  const code = extractPickupCode(content);
  if (code) return true;
  const company = extractCompany(content);
  const station = extractStation(content);
  if (company && station) return true;
  if (company && BUSINESS_KW.some(kw => content.includes(kw))) return true;
  if (BUSINESS_KW.filter(kw => content.includes(kw)).length >= 2) return true;
  return false;
}

function parseSms(content) {
  if (!content || typeof content !== 'string') return { ok: false, error: '内容为空' };
  if (!isRelevant(content)) return { ok: false, error: '内容不是快递相关短信' };
  return {
    ok: true,
    data: {
      pickupCode: extractPickupCode(content),
      station: extractStation(content),
      company: extractCompany(content),
      address: extractAddress(content),
      phone: extractPhone(content),
      date: extractDate(content),
      waybill: extractWaybill(content),
    },
  };
}

module.exports = { parseSms, extractPickupCode, extractStation, extractCompany, extractPhone, extractDate, extractAddress, extractWaybill };
