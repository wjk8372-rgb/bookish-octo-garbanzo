# 验证码实时查看器 —— 电脑端
#
# 功能：
#   1. 接收 Android 端 SmsForwarder 转发过来的短信（POST /api/sms-webhook）
#   2. 用 IMAP 轮询 QQ 邮箱 / Gmail 未读邮件，提取验证码
#   3. 提取短信和邮件正文里的验证码
#   4. 通过 SSE（Server-Sent Events）实时推送到网页
#
# 配置：把 config.example.json 复制为 config.json 后按需修改
#   - email_accounts[].password 用「授权码 / 应用专用密码」，不是登录密码
#       QQ 邮箱授权码：设置 -> 账户 -> 开启 IMAP/SMTP 服务 -> 生成授权码
#       Gmail 应用专用密码：myaccount.google.com -> 安全 -> 应用密码（需先开两步验证）
#
# 运行：python server.py  （或 uvicorn server:app --host 0.0.0.0 --port 8080）
# 打开：http://localhost:8080

import asyncio
import json
import queue
import re
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, Query
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from contextlib import asynccontextmanager

try:
    from imap_tools import MailBox, AND
    HAS_IMAP = True
except ImportError:
    HAS_IMAP = False


def resource_path(relative: str) -> Path:
    """资源路径：兼容 PyInstaller 单文件模式（--onefile 运行时解压到 _MEIPASS）。"""
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base / relative


def config_path() -> Path:
    """配置文件路径：打包后放在 exe 同目录，便于用户编辑。开发态放脚本同目录。"""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent / "config.json"
    return Path(__file__).resolve().parent / "config.json"


TEMPLATE_FILE = resource_path("templates/index.html")
CONFIG_FILE = config_path()


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        print("[配置] 未找到 config.json，使用空配置。请复制 config.example.json 为 config.json 后填写。")
        return {}
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[配置] config.json 解析失败: {e}")
        return {}


CONFIG = load_config()


# ---------- 验证码提取 ----------

# 关键词后允许出现「：/:/空格/是/为/分号/逗号」等分隔，再跟 4~8 位字母数字验证码
_KEYWORD_GROUP = (
    r"验证码|动态码|校验码|动态密码|验证码|短信码|验证号|"
    r"verification\s*code|security\s*code|confirm(?:ation)?\s*code|"
    r"one[-\s]?time\s*password|otp|access\s*code|login\s*code|"
    r"your\s*code|code\s*is|passcode"
)
# 关键词 + (可选分隔符/「是/为」) + 验证码
_CODE_NEAR_KW = re.compile(
    rf"(?:{_KEYWORD_GROUP})(?:[^0-9A-Za-z]{{0,12}})([A-Z0-9]{{4,8}})",
    re.IGNORECASE,
)
# 兜底：独立的 4~8 位数字
_CODE_DIGITS = re.compile(r"(?<!\d)(\d{4,8})(?!\d)")

# 明显不是验证码的内容，直接跳过（避免把银行余额、运单号当验证码）
_BLOCK_KW = re.compile(
    r"余额|到账|转账|消费|还款|信用卡账单|运单号|快递单号|取件码|提货码|"
    r"invoice|tracking\s*number|waybill",
    re.IGNORECASE,
)


def strip_html(text: str) -> str:
    """粗略去除 HTML 标签，转成纯文本用于提取验证码。"""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text)
    return text


def extract_code(text: str) -> str | None:
    """从短信/邮件正文中提取验证码，找不到返回 None。"""
    if not text:
        return None
    if _BLOCK_KW.search(text):
        # 先尝试关键词附近（即便命中黑名单也允许，比如「验证码」依然优先）
        m = _CODE_NEAR_KW.search(text)
        return m.group(1).upper() if m else None
    m = _CODE_NEAR_KW.search(text)
    if m:
        return m.group(1).upper()
    m = _CODE_DIGITS.search(text)
    if m:
        return m.group(1)
    return None


# ---------- 验证码存储 + SSE 订阅 ----------

class CodeStore:
    def __init__(self, max_items: int = 300):
        self._items: list[dict] = []
        self._max = max_items
        self._lock = threading.Lock()
        self._subscribers: list[queue.Queue] = []

    def add(self, item: dict) -> bool:
        """添加一条记录，返回是否新增（按 code+来源+10分钟内去重）。"""
        with self._lock:
            now = time.time()
            for old in self._items:
                if (
                    old.get("code") == item.get("code")
                    and old.get("source") == item.get("source")
                    and now - old.get("_ts", 0) < 600
                ):
                    return False
            item["_ts"] = now
            self._items.insert(0, item)
            if len(self._items) > self._max:
                self._items = self._items[: self._max]
            for q in list(self._subscribers):
                try:
                    q.put_nowait(item)
                except queue.Full:
                    pass
            return True

    def all(self) -> list[dict]:
        with self._lock:
            return [
                {k: v for k, v in it.items() if not k.startswith("_")}
                for it in self._items
            ]

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=256)
        with self._lock:
            # 给新订阅者先发一条 hello，前端可借此初始化
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)


STORE = CodeStore(max_items=CONFIG.get("keep_codes", 300))


def now_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def make_item(*, source: str, sender: str, subject: str, body: str, code: str | None) -> dict:
    return {
        "code": code,
        "source": source,
        "sender": sender,
        "subject": subject or "",
        "preview": (body or "")[:120],
        "time": now_iso(),
    }


# ---------- IMAP（IDLE 实时 + 轮询兜底） ----------

def process_unseen(mb, label: str, seen_uids: set):
    """处理当前未读邮件：提取验证码并标记已读。原地修改 seen_uids。"""
    for msg in mb.fetch(AND(seen=False), reverse=True, limit=20):
        if msg.uid in seen_uids:
            continue
        seen_uids.add(msg.uid)
        if len(seen_uids) > 500:  # 防止无限增长
            keep = list(seen_uids)[-300:]
            seen_uids.clear()
            seen_uids.update(keep)
        text = msg.text or strip_html(msg.html)
        code = extract_code(text)
        if not code:
            continue  # 不是验证码邮件，忽略但保持未读，下次不再处理
        item = make_item(
            source=label,
            sender=msg.from_,
            subject=msg.subject,
            body=text,
            code=code,
        )
        if STORE.add(item):
            print(f"[IMAP] {label} 收到验证码: {code} (from {msg.from_})")
        mb.flag(msg.uid, "\\Seen", True)  # 仅对验证码邮件标记已读


def imap_worker(account: dict) -> None:
    if not HAS_IMAP:
        print(f"[IMAP] imap_tools 未安装，跳过 {account.get('label')}")
        return
    label = account.get("label", account.get("email", "?"))
    idle_timeout = CONFIG.get("idle_timeout_seconds", 60)
    fallback_interval = CONFIG.get("poll_interval_seconds", 15)
    seen_uids: set[str] = set()
    print(f"[IMAP] 启动（优先 IDLE 模式）：{label}")
    while True:
        idle_ok = True  # 每次重连都重新尝试 IDLE
        try:
            with MailBox(account["server"], port=account.get("port", 993)).login(
                account["email"], account["password"],
                initial_folder=account.get("folder", "INBOX"),
            ) as mb:
                process_unseen(mb, label, seen_uids)  # 先处理当前已存在的未读
                while True:  # 持续监听，连接保持
                    if idle_ok:
                        try:
                            mb.idle.start()
                            mb.idle.wait(timeout=idle_timeout)  # 阻塞，新邮件到达或超时返回
                            mb.idle.done()
                        except Exception as ie:
                            s = str(ie).lower()
                            # 服务器不支持 IDLE → 回退轮询；其它异常 → 重连
                            if "support" in s or "capability" in s or ("idle" in s and ("not" in s or "no" in s)):
                                print(f"[IMAP] {label} 不支持 IDLE，回退到 {fallback_interval}s 轮询")
                                idle_ok = False
                                try:
                                    mb.idle.done()
                                except Exception:
                                    pass
                                continue
                            raise
                    else:
                        time.sleep(fallback_interval)
                    process_unseen(mb, label, seen_uids)
        except Exception as e:
            print(f"[IMAP] {label} 连接出错: {e}，{fallback_interval}s 后重连")
            time.sleep(fallback_interval)


# ---------- FastAPI ----------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动 IMAP 轮询线程
    for acc in CONFIG.get("email_accounts", []):
        if not acc.get("enabled", True):
            continue
        if not acc.get("email") or not acc.get("password"):
            print(f"[IMAP] 跳过未配置的账号: {acc.get('label')}")
            continue
        t = threading.Thread(target=imap_worker, args=(acc,), daemon=True)
        t.start()
    yield


app = FastAPI(title="验证码实时查看器", lifespan=lifespan)


@app.get("/")
async def index():
    if TEMPLATE_FILE.exists():
        return HTMLResponse(TEMPLATE_FILE.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>templates/index.html 不存在</h1>", status_code=500)


@app.get("/api/codes")
async def list_codes(limit: int = Query(100, ge=1, le=1000)):
    items = STORE.all()
    return JSONResponse({"total": len(items), "items": items[:limit]})


@app.post("/api/sms-webhook")
async def sms_webhook(req: Request):
    """接收 Android SmsForwarder 转发来的短信。
    兼容多种字段名：content/message/text, from/sender/phone。
    若配置了 webhook_token，则需在 query ?token= 或 header X-Token 带上。
    """
    token = CONFIG.get("webhook_token")
    if token:
        given = req.query_params.get("token") or req.headers.get("x-token", "")
        if given != token:
            return JSONResponse({"ok": False, "error": "token 无效"}, status_code=401)

    try:
        body = await req.json()
    except Exception:
        body = {}

    content = (
        body.get("content")
        or body.get("message")
        or body.get("text")
        or body.get("body")
        or ""
    )
    sender = (
        body.get("from")
        or body.get("sender")
        or body.get("phone")
        or body.get("number")
        or ""
    )
    content = str(content)
    code = extract_code(content)
    item = make_item(
        source="短信",
        sender=str(sender),
        subject="",
        body=content,
        code=code,
    )
    inserted = STORE.add(item)
    return JSONResponse({"ok": True, "code": code, "inserted": inserted, "item": {k: v for k, v in item.items() if not k.startswith("_")}})


@app.get("/api/stream")
async def stream(req: Request):
    q = STORE.subscribe()
    loop = asyncio.get_event_loop()

    async def gen():
        try:
            # 先把现有历史一次性推过去，方便新连接初始化
            for it in STORE.all():
                yield f"event: history\ndata: {json.dumps(it, ensure_ascii=False)}\n\n"
            while True:
                if await req.is_disconnected():
                    break
                try:
                    item = await loop.run_in_executor(None, q.get, True, 1)
                    yield f"event: code\ndata: {json.dumps({k: v for k, v in item.items() if not k.startswith('_')}, ensure_ascii=False)}\n\n"
                except queue.Empty:
                    yield ": ping\n\n"  # 保持连接
        finally:
            STORE.unsubscribe(q)

    return StreamingResponse(gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })


if __name__ == "__main__":
    host = CONFIG.get("listen_host", "0.0.0.0")
    port = CONFIG.get("listen_port", 8080)
    print("=" * 50)
    print(" 验证码实时查看器")
    print(f" 网页:   http://localhost:{port}")
    print(f" 短信接口: POST http://<本机IP>:{port}/api/sms-webhook")
    print(f" 实时流:   GET  http://localhost:{port}/api/stream")
    print("=" * 50)
    uvicorn.run(app, host=host, port=port, log_level="info")
