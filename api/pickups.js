const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join('/tmp', 'pickup-data');
const STORE_FILE = path.join(DATA_DIR, 'pickups.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8');
}
function readAll() { ensureStore(); try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')); } catch { return []; } }

module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const phone = (url.searchParams.get('phone') || '').trim();
  if (!phone) return res.status(400).json({ error: '缺少 phone 参数' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ error: '手机号格式不正确' });
  const list = readAll().filter(p => p.phone === phone);
  return res.status(200).json({ phone, total: list.length, items: list });
};
