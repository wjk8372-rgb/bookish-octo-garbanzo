// ============================================================
// 终极单文件 API：health / pickups / trackquery / smswebhook
// 全部逻辑内嵌，不需要任何 require('../xxx')，避免 Vercel 路径问题
// ============================================================

const fs = require('fs');
const path = require('path');

// ---------- 数据存储 ----------
const DATA_DIR = path.join('/tmp', 'pickup-data');
const STORE_FILE = path.join(DATA_DIR, 'pickups.json');

function ensureStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8');
  } catch (e) {}
}
function readAll() { ensureStore(); try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')); } catch(e) { return []; } }
function writeAll(list) {
  ensureStore();
  try {
    const tmp = STORE_FILE + '.tmp.' + Date.now();
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tmp, STORE_FILE);
  } catch (e) {}
}

// ---------- sms-parser（内嵌）----------
(function(scope){
  const PICKUP_PATTERNS = [
    /取件码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
    /凭码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
    /取件号码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
    /提货码[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/,
  ];
  const WAYBILL_PATTERNS = [
    /运单号[:：\s]*([A-Za-z0-9]{8,30})/,
    /快递单号[:：\s]*([A-Za-z0-9]{8,30})/,
    /单号[:：\s]*([A-Za-z0-9]{8,30})/,
  ];
  const STATION_ANCHORS = ['到达', '抵达', '送达', '投递至', '送到', '至', '于', '在'];
  const COMPANY_KW = [
    { name: '顺丰速运', words: ['顺丰'] },
    { name: '京东快递', words: ['京东'] },
    { name: '中通快递', words: ['中通'] },
    { name: '圆通速递', words: ['圆通'] },
    { name: '申通快递', words: ['申通'] },
    { name: '韵达快递', words: ['韵达'] },
    { name: '邮政EMS', words: ['邮政', 'EMS'] },
    { name: '极兔速递', words: ['极兔'] },
    { name: '菜鸟驿站', words: ['菜鸟'] },
    { name: '丰巢', words: ['丰巢'] },
  ];
  const BUSINESS_KW = ['快递', '取件', '驿站', '包裹', '快件', '派送', '运单', '派件员', '签收', '揽收', '投递', '丰巢', '菜鸟', '韵达', '顺丰', '京东', '中通', '圆通', '申通', '邮政', '极兔'];

  function extractPickupCode(c) {
    for (const re of PICKUP_PATTERNS) { const m = c.match(re); if (m && m[1]) return m[1].trim(); }
    return null;
  }
  function extractWaybill(c) {
    for (const re of WAYBILL_PATTERNS) { const m = c.match(re); if (m && m[1]) return m[1].trim(); }
    return null;
  }
  function extractStation(c) {
    for (const a of STATION_ANCHORS) {
      const i = c.indexOf(a); if (i < 0) continue;
      const rest = c.slice(i + a.length);
      const m = rest.match(/^(.+?)(?:取件|凭码|，|。|！|\s{2}|$)/);
      if (m && m[1]) {
        let s = m[1].trim().replace(/^[：:\s]+/, '').replace(/[，,。！!]+$/, '').trim();
        if (s.length >= 2 && s.length <= 40) return s;
      }
    }
    const bracket = c.match(/【(.+?)】/);
    if (bracket && bracket[1]) {
      const s = bracket[1].trim();
      if (COMPANY_KW.some(k => k.words.some(w => s.includes(w)))) return s;
    }
    return null;
  }
  function extractCompany(c) {
    for (const co of COMPANY_KW) if (co.words.some(w => c.includes(w))) return co.name;
    return null;
  }
  function extractAddress(c) { const m = c.match(/地址[:：]\s*([^\n，。]{3,60})/); return m ? m[1].trim() : null; }
  function extractPhone(c) { const m = c.match(/\b(1[3-9]\d{9})\b/); return m ? m[1] : null; }
  function extractDate(c) { const m = c.match(/(\d{1,2}[-\/月]\d{1,2}[日号]?\s*\d{1,2}[:：]\d{1,2})/); return m ? m[1] : null; }
  function isRelevant(c) {
    if (/验证码|校验码|银行|转账|还款|信用卡|贷款|营销|优惠|活动|红包|广告/.test(c)) return false;
    if (extractPickupCode(c)) return true;
    const co = extractCompany(c); const st = extractStation(c);
    if (co && st) return true;
    if (co && BUSINESS_KW.some(k => c.includes(k))) return true;
    if (BUSINESS_KW.filter(k => c.includes(k)).length >= 2) return true;
    return false;
  }
  function parseSms(content) {
    if (!content || typeof content !== 'string') return { ok: false, error: '内容为空' };
    if (!isRelevant(content)) return { ok: false, error: '内容不是快递相关短信' };
    return {
      ok: true,
      data: {
        pickupCode: extractPickupCode(content), station: extractStation(content),
        company: extractCompany(content), address: extractAddress(content),
        phone: extractPhone(content), date: extractDate(content),
        waybill: extractWaybill(content),
      },
    };
  }
  scope._sms = { parseSms };
})(global);

// ---------- 快递鸟（只保留 mock，内嵌）----------
(function(scope){
  const MOCK_TRACKS = {
    'SF1234567890123': {
      company: '顺丰速运', state: '2',
      traces: [
        { AcceptTime: '2026-08-24 22:05:00', AcceptStation: '快件离开【北京分拨中心】已发往【朝阳营业点】' },
        { AcceptTime: '2026-08-25 07:30:00', AcceptStation: '快件到达【北京朝阳区营业点】' },
        { AcceptTime: '2026-08-25 09:12:00', AcceptStation: '快件已到达【阳光小区菜鸟驿站】取件码8-2-1563，请凭取件码及时取件' },
      ],
    },
    '75812345678': {
      company: '中通快递', state: '2',
      traces: [
        { AcceptTime: '2026-08-25 10:10:00', AcceptStation: '快件到达【北京朝阳区中关村网点】' },
        { AcceptTime: '2026-08-25 14:40:00', AcceptStation: '【北京朝阳区中关村网点】正在派送中，派件员：张师傅 138xxxx' },
      ],
    },
    'YD888777666555': {
      company: '韵达快递', state: '3',
      traces: [
        { AcceptTime: '2026-08-24 16:20:00', AcceptStation: '【配送员】李师傅正在为您派送' },
        { AcceptTime: '2026-08-24 18:02:00', AcceptStation: '已签收，签收方式：本人签收' },
      ],
    },
  };

  function extractFromTraces(traces) {
    if (!traces || !traces.length) return {};
    for (let i = traces.length - 1; i >= 0; i--) {
      const text = traces[i].AcceptStation || '';
      let code = null;
      const m = text.match(/(?:取件码|凭码|提货码|取货码|凭取件码)[:：\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/);
      if (m && m[1]) code = m[1].trim();
      let station = null;
      for (const a of ['到达', '抵达', '送达', '投递至', '送到', '至', '于', '在']) {
        const j = text.indexOf(a); if (j < 0) continue;
        const rest = text.slice(j + a.length);
        const mm = rest.match(/^(.+?)(?:取件|凭码|，|。|！|$)/);
        if (mm && mm[1]) {
          let s = mm[1].trim().replace(/^[：:\s]+/, '').replace(/[，,。！!]+$/, '').trim();
          if (s.length >= 2 && s.length <= 40) { station = s; break; }
        }
      }
      if (code || station) return { pickupCode: code, station };
    }
    return {};
  }

  async function queryPickupCode(waybill) {
    const m = MOCK_TRACKS[waybill];
    if (!m) return { ok: false, mock: true, error: 'mock 运单号：SF1234567890123 / 75812345678 / YD888777666555' };
    const ext = extractFromTraces(m.traces);
    return {
      ok: true, mock: true, data: {
        waybill, company: m.company,
        pickupCode: ext.pickupCode || null, station: ext.station || null,
        state: m.state, traces: m.traces,
      },
    };
  }
  scope._kd = { queryPickupCode };
})(global);

// ---------- 工具 ----------
function badRequest(res, msg) { return res.status(400).json({ error: msg }); }
function isPhone(s) { return /^1[3-9]\d{9}$/.test(s || ''); }

// ---------- 路由总入口 ----------
module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    // Vercel rewrite 后 pathname 可能变成 /api/index，需要拿到「原始请求路径」
    let pathname = url.pathname;
    // 兼容 /api/index 或 /api/<anything>，一律去掉前缀 /api
    const rel = pathname.replace(/^\/api/, '') || '/';
    const method = req.method;
    const body = req.body || {};

    // ---------- GET /api/health ----------
    if ((rel === '/health' || rel === '/health/') && method === 'GET') {
      return res.status(200).json({ ok: true, time: new Date().toISOString(), kuaidiMockMode: true, pathname, rel });
    }

    // ---------- GET /api/pickups ----------
    if ((rel === '/pickups' || rel === '/pickups/') && method === 'GET') {
      const phone = (url.searchParams.get('phone') || '').trim();
      if (!phone) return badRequest(res, '缺少 phone');
      if (!isPhone(phone)) return badRequest(res, '手机号格式不正确');
      const items = readAll().filter(p => p.phone === phone);
      return res.status(200).json({ phone, total: items.length, items, _rel: rel });
    }

    // ---------- POST /api/trackquery （连字符和非连字符都接受）----------
    if ((rel === '/trackquery' || rel === '/track-query' || rel === '/trackquery/' || rel === '/track-query/') && (method === 'POST' || method === 'GET')) {
      if (method === 'GET') {
        return res.status(200).json({
          ok: true, mock: true, _hint: '请用 POST body: {"waybill":"SF1234567890123","phone":"13800138000"}',
          testWaybills: ['SF1234567890123', '75812345678', 'YD888777666555'],
        });
      }
      const waybill = String(body.waybill || '').trim();
      const phone = String(body.phone || '').trim();
      if (!waybill) return badRequest(res, '缺少 waybill');
      if (phone && !isPhone(phone)) return badRequest(res, '手机号格式不正确');
      const result = await global._kd.queryPickupCode(waybill);
      if (!result.ok) return res.status(200).json({ ok: false, mock: true, error: result.error, waybill });
      const data = result.data;
      let inserted = false, record = null;
      if (phone) {
        const list = readAll();
        const exists = list.some(p =>
          p.phone === phone && (
            (data.pickupCode && p.pickupCode === data.pickupCode) ||
            (p.waybill === waybill)
          )
        );
        if (!exists) {
          const trackState = data.state ? String(data.state) : null;
          let status = 'pending';
          if (data.pickupCode) status = 'arrived';
          else if (trackState === '3') status = 'signed';
          else if (trackState === '2') status = 'in_transit';
          else if (trackState === '4') status = 'problem';
          record = {
            id: 'pk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            source: 'track', phone, pickupCode: data.pickupCode, station: data.station,
            company: data.company, address: null, waybill, trackState,
            traces: Array.isArray(data.traces) ? data.traces.slice(-5) : null,
            smsDate: null, receivedAt: new Date().toISOString(), raw: null, status,
            createdAt: new Date().toISOString(),
          };
          list.push(record); writeAll(list); inserted = true;
        }
      }
      return res.status(200).json({ ok: true, mock: true, inserted, record, data, _rel: rel });
    }

    // ---------- POST /api/smswebhook（连字符和非连字符都接受）----------
    if ((rel === '/smswebhook' || rel === '/sms-webhook' || rel === '/smswebhook/' || rel === '/sms-webhook/') && method === 'POST') {
      const content = String(body.content || '');
      const phone = String(body.phone || '').trim();
      if (!content) return badRequest(res, '缺少 content');
      const parsed = global._sms.parseSms(content);
      if (!parsed.ok) return res.status(200).json({ parsed: false, reason: parsed.error });
      const recipientPhone = phone || parsed.data.phone;
      if (!recipientPhone) return badRequest(res, '缺少 phone');
      if (!isPhone(recipientPhone)) return badRequest(res, '手机号格式不正确');
      const list = readAll();
      const exists = list.some(p =>
        p.phone === recipientPhone && (
          (parsed.data.pickupCode && p.pickupCode === parsed.data.pickupCode) ||
          (parsed.data.waybill && p.waybill === parsed.data.waybill) ||
          (!parsed.data.pickupCode && !parsed.data.waybill && p.raw === content)
        )
      );
      if (exists) return res.status(200).json({ parsed: true, inserted: false, data: parsed.data });
      const status = parsed.data.pickupCode ? 'arrived' : 'pending';
      const record = {
        id: 'pk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        source: 'sms', phone: recipientPhone,
        pickupCode: parsed.data.pickupCode, station: parsed.data.station,
        company: parsed.data.company, address: parsed.data.address,
        waybill: parsed.data.waybill || null, trackState: null, traces: null,
        smsDate: parsed.data.date, receivedAt: new Date().toISOString(), raw: content, status,
        createdAt: new Date().toISOString(),
      };
      list.push(record); writeAll(list);
      return res.status(200).json({ parsed: true, inserted: true, record, data: parsed.data });
    }

    // 未命中
    return res.status(404).json({ error: 'NO_ROUTE', pathname, rel, method });
  } catch (e) {
    return res.status(500).json({ error: 'INTERNAL: ' + String(e && e.message || e), stack: String(e && e.stack || '') });
  }
};
