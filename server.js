// 后端服务：短信 Webhook + 运单号反查取件码 + 按手机号查询 + 文件存储
// 端口：8787
// 路由：
//   POST /api/sms-webhook     { from, content, phone?, receivedAt? } 中间件推送短信
//   POST /api/track-query    { waybill, phone?, shipperCode? } 运单号反查取件码（快递鸟）
//   GET  /api/pickups?phone= 按手机号查询所有取件记录（短信源 + 运单号源合并）
//   GET  /api/health         健康检查
// 存储：JSON 文件 data/pickups.json（首启自动创建）

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseSms } = require('./sms-parser');
const kuaidi = require('./kuaidi');

const PORT = 8787;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'pickups.json');

// —— 文件存储（带简单互斥，单进程足够）——
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '[]');
  } catch {
    return [];
  }
}

function writeAll(list) {
  ensureStore();
  // 原子写：先写临时文件再 rename，避免半写
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8');
  fs.renameSync(tmp, DATA_FILE);
}

// —— 业务逻辑 ——

// 记录来源：短信解析 / 运单号反查
const SOURCE_SMS = 'sms';
const SOURCE_TRACK = 'track';

function savePickup(parsed, meta) {
  const list = readAll();
  // 去重维度：
  //   1) 手机号 + 取件码（主键级，绝对去重）
  //   2) 手机号 + 运单号（运单号级，绝对去重）
  //   3) 短信源无取件码无运单号时：手机号 + 原始内容（避免同一条短信重复推送）
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

  // 计算展示状态：
  //   arrived  - 有取件码（短信或轨迹已包含取件码）
  //   signed    - 快递鸟 state=3 已签收（但无取件码）
  //   in_transit - 快递鸟 state=2 在途中
  //   problem   - 快递鸟 state=4 问题件
  //   pending   - 其他（待生成取件码）
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
    traces: Array.isArray(parsed.traces) ? parsed.traces.slice(-5) : null, // 仅保留最新 5 条
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

// —— HTTP 工具 ——
function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => (buf += c));
    req.on('end', () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// —— 路由 ——
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') return sendJson(res, 204, {});

  // 健康检查
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      time: new Date().toISOString(),
      kuaidiMockMode: kuaidi.isMockMode(),
    });
  }

  // 查询：GET /api/pickups?phone=138xxxx
  if (pathname === '/api/pickups' && req.method === 'GET') {
    const phone = (url.searchParams.get('phone') || '').trim();
    if (!phone) return sendJson(res, 400, { error: '缺少 phone 参数' });
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return sendJson(res, 400, { error: '手机号格式不正确' });
    }
    const list = queryByPhone(phone);
    return sendJson(res, 200, { phone, total: list.length, items: list });
  }

  // 运单号反查取件码：POST /api/track-query
  // body: { waybill, phone?, shipperCode? }
  // 调快递鸟 1002 拿轨迹 → 在 AcceptStation 里正则提取取件码 / 驿站 → 入库
  if (pathname === '/api/track-query' && req.method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: '请求体不是合法 JSON' });
    }

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

    // 反查成功 → 入库（如提供 phone 则关联到该手机号）
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

  // 短信 Webhook：POST /api/sms-webhook
  if (pathname === '/api/sms-webhook' && req.method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: '请求体不是合法 JSON' });
    }

    const content = (body.content || '').toString();
    const from = (body.from || '').toString();
    const phone = (body.phone || '').toString().trim();
    const receivedAt = body.receivedAt || new Date().toISOString();

    if (!content) {
      return sendJson(res, 400, { error: '缺少 content 字段' });
    }

    const parsed = parseSms(content);
    if (!parsed.ok) {
      return sendJson(res, 200, {
        parsed: false,
        reason: parsed.error,
        from,
        receivedAt,
      });
    }

    const result = savePickup(parsed.data, { source: SOURCE_SMS, content, from, phone, receivedAt });
    return sendJson(res, 200, {
      parsed: true,
      inserted: result.inserted,
      record: result.record || null,
      data: parsed.data,
    });
  }

  // PWA 静态资源
  const STATIC_FILES = {
    '/manifest.json': 'application/manifest+json; charset=utf-8',
    '/sw.js':         'application/javascript; charset=utf-8',
    '/icons/icon-512.jpg': 'image/jpeg',
  };
  if (req.method === 'GET' && STATIC_FILES[pathname]) {
    const file = path.join(__dirname, pathname.slice(1));
    if (fs.existsSync(file)) {
      const buf = fs.readFileSync(file);
      res.writeHead(200, {
        'Content-Type': STATIC_FILES[pathname],
        'Cache-Control': pathname === '/sw.js' ? 'no-cache' : 'public, max-age=86400',
      });
      return res.end(buf);
    }
  }

  // 静态：根路径返回前端
  if (pathname === '/' && req.method === 'GET') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  sendJson(res, 404, { error: 'Not Found', path: pathname });
});

server.listen(PORT, () => {
  ensureStore();
  console.log(`[取件服务] 已启动: http://localhost:${PORT}`);
  console.log(`  POST /api/sms-webhook     短信推送`);
  console.log(`  POST /api/track-query     运单号反查取件码（快递鸟）`);
  console.log(`  GET  /api/pickups?phone=  按手机号查询`);
  console.log(`  GET  /                    前端页面`);
  console.log(`  [快递鸟] ${kuaidi.isMockMode() ? 'mock 模式（未配置 KDNIAO_EBUSINESS_ID / KDNIAO_API_KEY）' : '真实模式'}`);
});
