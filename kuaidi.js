// 快递鸟 API 客户端
// 文档：https://www.kdniao.com/api-track
//
// 接口：
//   - 即时查询（1002）：输入 ShipperCode + LogisticCode → 返回 Traces 物流轨迹
//   - 单号识别（2002）：输入 LogisticCode → 返回可能归属的快递公司列表
//
// 签名规则（DataSign）：
//   sign = MD5(RequestData原串 + AppKey)        // 32位小写hex
//   DataSign = urlEncode(base64(sign))         // utf-8
//
// 凭证：
//   从环境变量读取 KDNIAO_EBUSINESS_ID 与 KDNIAO_API_KEY
//   未配置时自动进入 mock 模式（sandbox 默认），不发起真实网络请求
//
// 取件码反查链路（queryPickupCode）：
//   1) 若未给 ShipperCode，先调 2002 单号识别反查公司
//   2) 调 1002 获取 Traces
//   3) 在 Traces[].AcceptStation 中用正则提取 取件码 / 驿站名 / 状态

'use strict';

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const EBUSINESS_ID = process.env.KDNIAO_EBUSINESS_ID || '';
const API_KEY = process.env.KDNIAO_API_KEY || '';
const USE_MOCK = !EBUSINESS_ID || !API_KEY;

// 正式 / 测试地址
const PROD_URL = 'https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx';
const SANDBOX_URL = 'http://sandboxapi.kdniao.com:8080/kdniaosandbox/gateway/exterfaceInvoke.json';
const API_URL = process.env.KDNIAO_USE_SANDBOX === '1' ? SANDBOX_URL : PROD_URL;

// 公司中文名 → 快递鸟编码（用于短信识别到公司后映射成 ShipperCode）
const COMPANY_TO_CODE = {
  '顺丰速运': 'SF',
  '京东快递': 'JD',
  '中通快递': 'ZTO',
  '圆通速递': 'YTO',
  '申通快递': 'STO',
  '韵达快递': 'YD',
  '邮政EMS': 'EMS',
  '极兔速递': 'JTSD',
};

// —— 工具函数 ——

function md5Upper(s) {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex');
}

function base64(s) {
  return Buffer.from(s, 'utf8').toString('base64');
}

// 按 urlEncode 规则（与 querystring 一致，空格→+）
function urlEncode(s) {
  return encodeURIComponent(s).replace(/%20/g, '+');
}

// 生成 DataSign
function makeSign(requestDataJson) {
  // 1) MD5(RequestData + AppKey)
  const md5Hex = md5Upper(requestDataJson + API_KEY);
  // 2) Base64
  const b64 = base64(md5Hex);
  // 3) URL 编码
  return urlEncode(b64);
}

// 用 application/x-www-form-urlencoded 提交
function postForm(urlStr, params) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const body = Object.entries(params)
      .map(([k, v]) => `${k}=${urlEncode(String(v))}`)
      .join('&');

    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ Success: false, Reason: '响应非 JSON: ' + data.slice(0, 200) });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// —— 真实接口 ——

/**
 * 1002 即时查询
 * @param {string} shipperCode 快递公司编码（如 SF / YTO）
 * @param {string} logisticCode 运单号
 */
async function queryTrack(shipperCode, logisticCode) {
  const requestData = JSON.stringify({
    OrderCode: '',
    ShipperCode: shipperCode,
    LogisticCode: logisticCode,
  });
  const params = {
    RequestData: requestData,
    EBusinessID: EBUSINESS_ID,
    RequestType: '1002',
    DataSign: makeSign(requestData),
    DataType: '2',
  };
  return postForm(API_URL, params);
}

/**
 * 2002 单号识别
 * @param {string} logisticCode 运单号
 */
async function identifyCompany(logisticCode) {
  const requestData = JSON.stringify({ LogisticCode: logisticCode });
  const params = {
    RequestData: requestData,
    EBusinessID: EBUSINESS_ID,
    RequestType: '2002',
    DataSign: makeSign(requestData),
    DataType: '2',
  };
  const resp = await postForm(API_URL, params);
  return resp;
}

// —— Mock 数据（沙盒无凭证时使用，让链路可演示）——

const MOCK_TRACKS = {
  // 顺丰样例：轨迹末尾含取件码
  SF1234567890123: {
    EBusinessID: 'mock',
    ShipperCode: 'SF',
    LogisticCode: 'SF1234567890123',
    Success: true,
    State: '3',
    Reason: null,
    Traces: [
      { AcceptTime: '2026-08-24 18:22:11', AcceptStation: '快件已从深圳集散中心发出', Remark: '' },
      { AcceptTime: '2026-08-25 08:11:45', AcceptStation: '快件已到达【阳光小区菜鸟驿站】', Remark: '' },
      { AcceptTime: '2026-08-25 08:12:03', AcceptStation: '已投递至阳光小区菜鸟驿站，取件码 8-2-1563，凭码取件', Remark: '' },
      { AcceptTime: '2026-08-25 08:12:03', AcceptStation: '签收', Remark: '' },
    ],
  },
  // 中通样例：轨迹末尾无取件码（演示"未识别到取件码"的回退）
  75812345678: {
    EBusinessID: 'mock',
    ShipperCode: 'ZTO',
    LogisticCode: '75812345678',
    Success: true,
    State: '2',
    Reason: null,
    Traces: [
      { AcceptTime: '2026-08-24 20:11:00', AcceptStation: '快件离开【上海转运中心】', Remark: '' },
      { AcceptTime: '2026-08-25 09:30:00', AcceptStation: '快件派送中，请保持电话畅通', Remark: '' },
    ],
  },
  // 韵达样例：已签收但无取件码（演示 signed 状态）
  YD9876543210: {
    EBusinessID: 'mock',
    ShipperCode: 'YD',
    LogisticCode: 'YD9876543210',
    Success: true,
    State: '3',
    Reason: null,
    Traces: [
      { AcceptTime: '2026-08-24 10:00:00', AcceptStation: '快件已到达【北京分拨中心】', Remark: '' },
      { AcceptTime: '2026-08-25 11:20:00', AcceptStation: '已签收，签收人：本人', Remark: '' },
    ],
  },
};

// —— 取件码 / 驿站 提取（与 sms-parser 解耦但同套规则）——
const TRACE_CODE_RE =
  /(?:取件码|取件号码|取件密码|提货码|取货码|凭码|凭取件码)[：:\s]*([A-Za-z0-9]+(?:-[A-Za-z0-9]+){0,3})/;

const STATION_SUFFIX_RE = '驿站|快递柜|智能柜|自提柜|自提点|代收点|服务站';
// 用动作词锚点 + 非贪婪，避免把"已投递至"也吞进站名
const TRACE_STATION_RE = new RegExp(
  `(?:到达|抵达|送达|投递至|送到|至|于|在)[^。！,，；\\n]*?([\\u4e00-\\u9fa5A-Za-z0-9（）()]{2,24}(?:${STATION_SUFFIX_RE}))`
);

// 公司编码 → 中文名（前端展示统一用中文名）
const CODE_TO_COMPANY = Object.fromEntries(
  Object.entries(COMPANY_TO_CODE).map(([k, v]) => [v, k])
);

/**
 * 从轨迹描述里提取取件码与驿站名
 */
function extractFromTraces(traces) {
  if (!Array.isArray(traces)) return { pickupCode: null, station: null, lastStation: null };
  let pickupCode = null;
  let station = null;
  // 倒序找：取件码通常在最末几条
  for (let i = traces.length - 1; i >= 0; i--) {
    const desc = traces[i].AcceptStation || '';
    if (!pickupCode) {
      const m = desc.match(TRACE_CODE_RE);
      if (m && m[1].length >= 4) pickupCode = m[1];
    }
    if (!station) {
      const m = desc.match(TRACE_STATION_RE);
      if (m) station = m[1];
    }
    if (pickupCode && station) break;
  }
  return { pickupCode, station };
}

/**
 * 高级接口：运单号反查取件码
 * @param {string} waybill 运单号
 * @param {string?} shipperCode 可选，已知公司编码
 * @returns {Promise<{ ok: boolean, mock?: boolean, error?: string, data?: object }>}
 */
async function queryPickupCode(waybill, shipperCode) {
  if (!waybill) return { ok: false, error: '缺少运单号' };

  // —— Mock 模式 ——
  if (USE_MOCK) {
    const m = MOCK_TRACKS[waybill] || {
      EBusinessID: 'mock',
      ShipperCode: shipperCode || 'UNKNOWN',
      LogisticCode: waybill,
      Success: false,
      State: '0',
      Reason: 'mock 模式下该运单号无预置数据',
      Traces: [],
    };
    if (!m.Success) {
      return { ok: false, mock: true, error: m.Reason || '查询失败' };
    }
    const extracted = extractFromTraces(m.Traces);
    return {
      ok: true,
      mock: true,
      data: {
        waybill,
        shipperCode: m.ShipperCode,
        company: CODE_TO_COMPANY[m.ShipperCode] || m.ShipperCode,
        state: m.State,
        traces: m.Traces,
        pickupCode: extracted.pickupCode,
        station: extracted.station,
      },
    };
  }

  // —— 真实模式 ——
  try {
    let code = shipperCode;
    if (!code) {
      const idResp = await identifyCompany(waybill);
      if (idResp.Success && Array.isArray(idResp.Shippers) && idResp.Shippers.length) {
        code = idResp.Shippers[0].ShipperCode;
      }
    }
    if (!code) {
      return { ok: false, error: '无法识别运单号的快递公司' };
    }

    const trackResp = await queryTrack(code, waybill);
    if (!trackResp.Success) {
      return { ok: false, error: trackResp.Reason || '查询失败' };
    }
    const extracted = extractFromTraces(trackResp.Traces);
    return {
      ok: true,
      data: {
        waybill,
        shipperCode: code,
        company: CODE_TO_COMPANY[code] || code,
        state: trackResp.State,
        traces: trackResp.Traces || [],
        pickupCode: extracted.pickupCode,
        station: extracted.station,
      },
    };
  } catch (e) {
    return { ok: false, error: '调用快递鸟异常: ' + e.message };
  }
}

module.exports = {
  queryTrack,
  identifyCompany,
  queryPickupCode,
  COMPANY_TO_CODE,
  isMockMode: () => USE_MOCK,
};
