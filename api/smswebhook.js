const fs = require('fs');
const path = require('path');
const { parseSms } = require('../sms-parser');

const DATA_DIR = path.join('/tmp', 'pickup-data');
const STORE_FILE = path.join(DATA_DIR, 'pickups.json');
const SOURCE_SMS = 'sms';

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8');
}
function readAll() { ensureStore(); try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')); } catch { return []; } }
function writeAll(list) { ensureStore(); const tmp = STORE_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8'); fs.renameSync(tmp, STORE_FILE); }

function savePickup(parsed, meta) {
  const list = readAll();
  const phone = meta.phone || parsed.phone || null;
  const exists = list.some(p =>
    p.phone === phone && (
      (parsed.pickupCode && p.pickupCode === parsed.pickupCode) ||
      (parsed.waybill && p.waybill === parsed.waybill) ||
      (!parsed.pickupCode && !parsed.waybill && p.raw === meta.content)
    )
  );
  if (exists) return { inserted: false };
  const status = parsed.pickupCode ? 'arrived' : 'pending';
  const record = {
    id: 'pk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    source: SOURCE_SMS, phone, pickupCode: parsed.pickupCode,
    station: parsed.station, company: parsed.company, address: parsed.address,
    waybill: parsed.waybill || null, trackState: null, traces: null,
    smsDate: parsed.date, receivedAt: meta.receivedAt || new Date().toISOString(),
    raw: meta.content || null, status, createdAt: new Date().toISOString(),
  };
  list.push(record); writeAll(list); return { inserted: true, record };
}

module.exports = async function handler(req, res) {
  const body = req.body || {};
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
};
