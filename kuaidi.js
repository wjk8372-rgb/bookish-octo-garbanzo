const crypto = require('crypto');
const https = require('https');

const EID = process.env.KDNIAO_EBUSINESS_ID || '';
const API_KEY = process.env.KDNIAO_API_KEY || '';
const USE_SANDBOX = process.env.KDNIAO_USE_SANDBOX === '1';

const BASE_URL = USE_SANDBOX
  ? 'https://sandboxapi.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx'
  : 'https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx';

const COMPANY_TO_CODE = {
  '顺丰速运': 'SF', '顺丰': 'SF', 'SF': 'SF',
  '京东快递': 'JD', '京东': 'JD', '京东物流': 'JD', 'JD': 'JD',
  '中通快递': 'ZTO', '中通': 'ZTO', 'ZTO': 'ZTO',
  '圆通速递': 'YTO', '圆通': 'YTO', 'YTO': 'YTO',
  '申通快递': 'STO', '申通': 'STO', 'STO': 'STO',
  '韵达快递': 'YD', '韵达': 'YD', 'YD': 'YD',
  '邮政EMS': 'EMS', 'EMS': 'EMS', '中国邮政': 'EMS', '邮政': 'EMS',
  '极兔速递': 'JTSD', '极兔': 'JTSD', 'JTSD': 'JTSD',
};
const CODE_TO_COMPANY = {};
for (const [k, v] of Object.entries(COMPANY_TO_CODE)) CODE_TO_COMPANY[v] = k;

function isMockMode() {
  return !EID || !API_KEY;
}

function md5(s) { return crypto.createHash('md5').update(s, 'utf8').digest('hex'); }
function base64(s) { return Buffer.from(s, 'utf8').toString('base64'); }
function urlEncode(obj) {
  return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
}
function makeSign(requestData) {
  return urlEncode({ DataSign: base64(md5(requestData + API_KEY)) });
}

function postRequest(form) {
  return new Promise((resolve, reject) => {
    const body = urlEncode(form);
    const req = https.request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = ''; res.on('data', (c) => data += c); res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function queryTrack(shipperCode, logisticCode) {
  const rd = { OrderCode: logisticCode, ShipperCode: shipperCode, LogisticCode: logisticCode };
  const reqJson = JSON.stringify(rd);
  const sign = makeSign(reqJson);
  const form = {
    RequestData: reqJson,
    EBusinessID: EID,
    RequestType: '1002',
    DataSign: sign.split('=')[1],
    DataType: 2,
  };
  const resp = await postRequest(form);
  try { return JSON.parse(resp); } catch { return resp; }
}

async function identifyCompany(logisticCode) {
  const rd = { LogisticCode: logisticCode };
  const reqJson = JSON.stringify(rd);
  const sign = makeSign(reqJson);
  const form = {
    RequestData: reqJson,
    EBusinessID: EID,
    RequestType: '2002',
    DataSign: sign.split('=')[1],
    DataType: 2,
  };
  const resp = await postRequest(form);
  try { return JSON.parse(resp); } catch { return resp; }
}

const MOCK_TRACKS = {
  'SF1234567890123': {
    code: 'SF', company: '顺丰速运', state: '2',
    traces: [
      { AcceptTime: '2026-08-24 22:05:00', AcceptStation: '快件离开【北京分拨中心】已发往【朝阳营业点】' },
      { AcceptTime: '2026-08-25 07:30:00', AcceptStation: '快件到达【北京朝阳区营业点】' },
      { AcceptTime: '2026-08-25 09:12:00', AcceptStation: '快件已到达【阳光小区菜鸟驿站】取件码8-2-1563，请凭取件码及时取件' },
    ],
  },
  '75812345678': {
    code: 'ZTO', company: '中通快递', state: '2',
    traces: [
      { AcceptTime: '2026-08-25 10:10:00', AcceptStation: '快件到达【北京朝阳区中关村网点】' },
      { AcceptTime: '2026-08-25 14:40:00', AcceptStation: '【北京朝阳区中关村网点】正在派送中，派件员：张师傅 138xxxx' },
    ],
  },
  'YD888777666555': {
    code: 'YD', company: '韵达快递', state: '3',
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

async function queryPickupCode(waybill, shipperCode) {
  if (isMockMode()) {
    const m = MOCK_TRACKS[waybill];
    if (!m) return { ok: false, mock: true, error: 'mock 模式下仅支持：SF1234567890123 / 75812345678 / YD888777666555' };
    const ext = extractFromTraces(m.traces);
    return {
      ok: true, mock: true, data: {
        waybill, company: m.company,
        pickupCode: ext.pickupCode || null,
        station: ext.station || null,
        state: m.state, traces: m.traces,
      },
    };
  }

  let code = shipperCode;
  let companyName = CODE_TO_COMPANY[shipperCode] || null;
  if (!code) {
    try {
      const idRes = await identifyCompany(waybill);
      if (idRes && idRes.Shippers && idRes.Shippers.length) {
        code = idRes.Shippers[0].ShipperCode;
        companyName = idRes.Shippers[0].ShipperName || CODE_TO_COMPANY[code];
      }
    } catch (e) { /* ignore */ }
  }
  if (!code) return { ok: false, error: '无法识别快递公司，请传入 shipperCode' };

  const trackRes = await queryTrack(code, waybill);
  if (!trackRes || !trackRes.Traces) return { ok: false, error: (trackRes && trackRes.Reason) || '未查询到轨迹' };
  const ext = extractFromTraces(trackRes.Traces);
  return {
    ok: true, data: {
      waybill, company: companyName || CODE_TO_COMPANY[code] || code,
      pickupCode: ext.pickupCode || null,
      station: ext.station || null,
      state: String(trackRes.State || ''),
      traces: trackRes.Traces,
    },
  };
}

module.exports = {
  queryTrack, identifyCompany, queryPickupCode,
  COMPANY_TO_CODE, CODE_TO_COMPANY,
  isMockMode, USE_SANDBOX, BASE_URL,
};
