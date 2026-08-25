// Vercel Serverless Function 入口
// 把原来的 http.createServer 改造成 @vercel/node 兼容的 handler
// 所有请求都会走 rewrites 路由到这里

const http = require('http');

// 复用原 server.js 的请求处理器（先 require 拿到 handler 函数）
// 由于原 server.js 会自动 listen，这里把它改造为导出 app 实例更稳
// 做法：直接内联核心逻辑，避免重复 listen

const fs = require('fs');
const path = require('path');
const { parseSms } = require('../sms-parser');
const kuaidi = require('../kuaidi');

const DATA_DIR = path.join('/tmp', 'pickup-data');
const STORE_FILE = path.join(DATA_DIR, 'pickups.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, '[]', 'utf-8');
  }
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAll(list) {
  ensureStore();
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8');
  fs.renameSync(tmp, STORE_FILE);
}

const SOURCE_SMS = 'sms';
const SOURCE_TRACK = 'track';

function savePickup(parsed, meta) {
  const list = readAll();
  const phone = meta.phone || parsed.phone || null;
  const exists = list.some(
    (p) =>
      p.phone === phone &&
      ((parsed.pickupCode && p.pickupCode === parsed.pickupCode) ||
        (parsed.waybill && p.waybill === parsed.waybill) ||
        (!parsed.pickupCode &&
          !parsed.waybill &&
          meta.source === SOURCE_SMS &&
          p.raw === meta.content))
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
    source: meta.source || SOURCE_SMS,
    phone,
    pickupCode: parsed.pickupCode,
    station: parsed.station,
    company: parsed.company,
    address: parsed.address,
    waybill: parsed.waybill || null,
    trackState,
    traces: Array.isArray(parsed.traces) ? parsed.traces.slice(-5) : null,
    smsDate: parsed.date,
    receivedAt: meta.receivedAt || new Date().toISOString(),
    raw: meta.content || null,
    status,
    createdAt: new Date().toISOString(),
  };
  list.push(record);
  writeAll(list);
  return { inserted: true, record };
}

function queryByPhone(phone) {
  if (!phone) return [];
  return readAll().filter((p) => p.phone === phone);
}

function sendJson(res, status, obj) {
  res.status(status).send(obj);
}

const STATIC_FILES = {
  '/manifest.json': { path: '../manifest.json', type: 'application/manifest+json; charset=utf-8' },
  '/sw.js':         { path: '../sw.js',         type: 'application/javascript; charset=utf-8' },
  '/icons/icon-512.jpg': { path: '../icons/icon-512.jpg', type: 'image/jpeg' },
};

// Vercel Serverless Function 导出
export default async function handler(req, res) {
  // 支持 Express 风格 API：req.method / req.url / req.query
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname;
  const method = req.method;

  // 静态文件
  if (method === 'GET' && STATIC_FILES[pathname]) {
    const s = STATIC_FILES[pathname];
    const file = path.join(__dirname, s.path);
    if (fs.existsSync(file)) {
      const buf = fs.readFileSync(file);
      res.setHeader('Content-Type', s.type);
      if (pathname === '/sw.js') res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(buf);
    }
  }

  // 根路径
  if (pathname === '/' && method === 'GET') {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  // 健康检查
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      time: new Date().toISOString(),
      kuaidiMockMode: kuaidi.isMockMode(),
    });
  }

  // POST /api/sms-webhook
  if (pathname === '/api/sms-webhook' && method === 'POST') {
    const body = req.body;
    const from = (body.from || '').toString();
    const content = (body.content || '').toString();
    const phone = (body.phone || '').toString().trim();
    const receivedAt = body.receivedAt;

    if (!content) return sendJson(res, 400, { error: '缺少 content 短信内容' });

    const parsed = parseSms(content);
    if (!parsed.ok) {
      return sendJson(res, 200, { parsed: false, reason: parsed.error });
    }
    const recipientPhone = phone || parsed.data.phone;
    if (!recipientPhone) {
      return sendJson(res, 400, {
        error: '未识别到接收方手机号，请在 body 中传入 phone 字段',
      });
    }
    if (recipientPhone && !/^1[3-9]\d{9}$/.test(recipientPhone)) {
      return sendJson(res, 400, { error: '手机号格式不正确' });
    }

    const result = savePickup(parsed.data, {
      source: SOURCE_SMS,
      content,
      from,
      phone: recipientPhone,
      receivedAt,
    });

    return sendJson(res, 200, {
      parsed: true,
      inserted: result.inserted,
      record: result.record || null,
      data: parsed.data,
    });
  }

  // POST /api/track-query
  if (pathname === '/api/track-query' && method === 'POST') {
    const body = req.body;
    const waybill = (body.waybill || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const shipperCode = (body.shipperCode || '').toString().trim() || null;

    if (!waybill) return sendJson(res, 400, { error: '缺少 waybill 运单号' });
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return sendJson(res, 400, { error: '手机号格式不正确' });
    }

    const result = await kuaidi.queryPickupCode(waybill, shipperCode);
    if (!result.ok) {
      return sendJson(res, 200, {
        ok: false,
        mock: result.mock || false,
        error: result.error,
        waybill,
      });
    }

    const data = result.data;
    let inserted = false;
    let record = null;
    if (phone) {
      const saved = savePickup(
        {
          pickupCode: data.pickupCode,
          station: data.station,
          company: data.company,
          address: null,
          phone,
          date: null,
          waybill: data.waybill,
          trackState: data.state,
          traces: data.traces,
        },
        { source: SOURCE_TRACK, phone, content: null }
      );
      inserted = saved.inserted;
      record = saved.record || null;
    }

    return sendJson(res, 200, {
      ok: true,
      mock: result.mock || false,
      inserted,
      record,
      data,
    });
  }

  // GET /api/pickups?phone=
  if (pathname === '/api/pickups' && method === 'GET') {
    const phone = (url.searchParams.get('phone') || '').trim();
    if (!phone) return sendJson(res, 400, { error: '缺少 phone 参数' });
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return sendJson(res, 400, { error: '手机号格式不正确' });
    }
    const list = queryByPhone(phone);
    return sendJson(res, 200, { phone, total: list.length, items: list });
  }

  return sendJson(res, 404, { error: 'Not Found', path: pathname });
}
