const fs = require('fs');
const path = require('path');
const kuaidi = require('../kuaidi');

const DATA_DIR = path.join('/tmp', 'pickup-data');
const STORE_FILE = path.join(DATA_DIR, 'pickups.json');
const SOURCE_TRACK = 'track';

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8');
}
function readAll() { ensureStore(); try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')); } catch { return []; } }
function writeAll(list) { ensureStore(); const tmp = STORE_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8'); fs.renameSync(tmp, STORE_FILE); }

function savePickup(parsed, meta) {
  const list = readAll();
  const phone = meta.phone || null;
  const exists = list.some(p =>
    p.phone === phone && (
      (parsed.pickupCode && p.pickupCode === parsed.pickupCode) ||
      (parsed.waybill && p.waybill === parsed.waybill)
    )
  );
  if (exists) return { inserted: false };
  const trackState = parsed.trackState != null ? String(parsed.trackState) : null;
  let status;
  if (parsed.pickupCode) status = 'arrived';
  else if (trackState === '3') status = 'signed';
  else if (trackState === '2') status = 'in_transit';
  else if (trackState === '4') status = 'problem';
  else status = 'pending';
  const record = {
    id: 'pk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    source: SOURCE_TRACK, phone, pickupCode: parsed.pickupCode,
    station: parsed.station, company: parsed.company, address: null,
    waybill: parsed.waybill || null, trackState,
    traces: Array.isArray(parsed.traces) ? parsed.traces.slice(-5) : null,
    smsDate: null, receivedAt: new Date().toISOString(),
    raw: null, status, createdAt: new Date().toISOString(),
  };
  list.push(record); writeAll(list); return { inserted: true, record };
}

module.exports = async function handler(req, res) {
  const body = req.body || {};
  const waybill = String(body.waybill || '').trim();
  const phone = String(body.phone || '').trim();
  const shipperCode = String(body.shipperCode || '').trim() || null;
  if (!waybill) return res.status(400).json({ error: '缺少 waybill 运单号' });
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ error: '手机号格式不正确' });

  // 容错：如果 require kuaidi 失败（例如环境变量缺失导致抛错），直接走内置 mock
  let result;
  try {
    if (kuaidi && typeof kuaidi.queryPickupCode === 'function') {
      result = await kuaidi.queryPickupCode(waybill, shipperCode);
    } else {
      result = builtinMock(waybill);
    }
  } catch (e) {
    result = builtinMock(waybill);
  }

  if (!result.ok) return res.status(200).json({ ok: false, mock: result.mock || false, error: result.error, waybill });

  const data = result.data;
  let inserted = false, record = null;
  if (phone) {
    const saved = savePickup(
      { pickupCode: data.pickupCode, station: data.station, company: data.company, waybill: data.waybill, trackState: data.state, traces: data.traces },
      { source: SOURCE_TRACK, phone }
    );
    inserted = saved.inserted; record = saved.record || null;
  }
  return res.status(200).json({ ok: true, mock: result.mock || false, inserted, record, data });
};

function builtinMock(waybill) {
  const mockData = {
    'SF1234567890123': {
      company: '顺丰速运', waybill: 'SF1234567890123', pickupCode: '8-2-1563',
      station: '阳光小区菜鸟驿站', state: '2',
      traces: [
        { AcceptTime: '2026-08-25 09:12:00', AcceptStation: '快件已到达【阳光小区菜鸟驿站】取件码8-2-1563，请凭取件码及时取件' },
        { AcceptTime: '2026-08-25 07:30:00', AcceptStation: '快件到达【北京朝阳区营业点】' },
        { AcceptTime: '2026-08-24 22:05:00', AcceptStation: '快件离开【北京分拨中心】已发往【朝阳营业点】' },
      ],
    },
    '75812345678': {
      company: '中通快递', waybill: '75812345678', pickupCode: null, station: null, state: '2',
      traces: [
        { AcceptTime: '2026-08-25 14:40:00', AcceptStation: '【北京朝阳区中关村网点】正在派送中，派件员：张师傅 138xxxx' },
        { AcceptTime: '2026-08-25 10:10:00', AcceptStation: '快件到达【北京朝阳区中关村网点】' },
      ],
    },
    'YD888777666555': {
      company: '韵达快递', waybill: 'YD888777666555', pickupCode: null, station: null, state: '3',
      traces: [
        { AcceptTime: '2026-08-24 18:02:00', AcceptStation: '已签收，签收方式：本人签收' },
        { AcceptTime: '2026-08-24 16:20:00', AcceptStation: '【配送员】李师傅正在为您派送' },
      ],
    },
  };
  const d = mockData[waybill];
  if (!d) return { ok: false, mock: true, error: 'Mock 数据中无该运单号，请使用 SF1234567890123 / 75812345678 / YD888777666555' };
  return { ok: true, mock: true, data: d };
}
