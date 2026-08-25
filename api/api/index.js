const fs = require('fs');
const path = require('path');
const { parseSms } = require('../sms-parser');
const kuaidi = require('../kuaidi');

const DATA_DIR = path.join('/tmp', 'pickup-data');
const STORE_FILE = path.join(DATA_DIR, 'pickups.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8');
}
function readAll() { ensureStore(); try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')); } catch { return []; } }
function writeAll(list) { ensureStore(); const tmp = STORE_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8'); fs.renameSync(tmp, STORE_FILE); }

const SOURCE_SMS = 'sms';
const SOURCE_TRACK = 'track';

function savePickup(parsed, meta) {
  const list = readAll();
  const phone = meta.phone || parsed.phone || null;
  const exists = list.some(p =>
    p.phone === phone && (
      (parsed.pickupCode && p.pickupCode === parsed.pickupCode) ||
      (parsed.waybill && p.waybill === parsed.waybill) ||
      (!parsed.pickupCode && !parsed.waybill && meta.source === SOURCE_SMS && p.raw === meta.content)
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
    source: meta.source || SOURCE_SMS, phone, pickupCode: parsed.pickupCode,
    station: parsed.station, company: parsed.company, address: parsed.address,
    waybill: parsed.waybill || null, trackState,
    traces: Array.isArray(parsed.traces) ? parsed.traces.slice(-5) : null,
    smsDate: parsed.date, receivedAt: meta.receivedAt || new Date().toISOString(),
    raw: meta.content || null, status, createdAt: new Date().toISOString(),
  };
  list.push(record); writeAll(list); return { inserted: true, record };
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname;
  const method = req.method;
  const body = req.body || {};

  if (pathname === '/api/health' && method === 'GET') {
    return res.status(200).json({ ok: true, time: new Date().toISOString(), kuaidiMockMode: kuaidi.isMockMode() });
  }

  if (pathname === '/api/sms-webhook' && method === 'POST') {
    const from = String(body.from || '');
    const content = String(body.content || '');
    const phone = String(body.phone || '').trim();
    const receivedAt = body.receivedAt;
    if (!content) return res.status(400).json({ error: '缺少 content 短信内容' });
    const parsed = parseSms(content);
    if (!parsed.ok) return res.status(200).json({ parsed: false, reason: parsed.error });
    const recipientPhone = phone || parsed.data.phone;
    if (!recipientPhone) return res.status(400).json({ error: '未识别到接收方手机号，请传 body.phone' });
    if (!/^1[3-9]\d{9}$/.test(recipientPhone)) return res.status(400).json({ error: '手机号格式不正确' });
    const result = savePickup(parsed.data, { source: SOURCE_SMS, content, from, phone: recipientPhone, receivedAt });
    return res.status(200).json({ parsed: true, inserted: result.inserted, record: result.record || null, data: parsed.data });
  }

  if (pathname === '/api/track-query' && method === 'POST') {
    const waybill = String(body.waybill || '').trim();
    const phone = String(body.phone || '').trim();
    const shipperCode = String(body.shipperCode || '').trim() || null;
    if (!waybill) return res.status(400).json({ error: '缺少 waybill 运单号' });
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ error: '手机号格式不正确' });
    const result = await kuaidi.queryPickupCode(waybill, shipperCode);
    if (!result.ok) return res.status(200).json({ ok: false, mock: result.mock || false, error: result.error, waybill });
    const data = result.data;
    let inserted = false, record = null;
    if (phone) {
      const saved = savePickup(
        { pickupCode: data.pickupCode, station: data.station, company: data.company, address: null, phone, date: null, waybill: data.waybill, trackState: data.state, traces: data.traces },
        { source: SOURCE_TRACK, phone, content: null }
      );
      inserted = saved.inserted; record = saved.record || null;
    }
    return res.status(200).json({ ok: true, mock: result.mock || false, inserted, record, data });
  }

  if (pathname === '/api/pickups' && method === 'GET') {
    const phone = (url.searchParams.get('phone') || '').trim();
    if (!phone) return res.status(400).json({ error: '缺少 phone 参数' });
    if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ error: '手机号格式不正确' });
    const list = readAll().filter(p => p.phone === phone);
    return res.status(200).json({ phone, total: list.length, items: list });
  }

  return res.status(404).json({ error: 'Not Found', path: pathname });
};
