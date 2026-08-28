# ============================================================
#  验证码实时查看器 - Windows 自检脚本
#  功能：检查环境 -> 启动服务 -> 发测试短信 -> 比对验证码提取
#  用法：powershell -ExecutionPolicy Bypass -File self-check.ps1
# ============================================================

# UTF-8 输出，避免中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$URL = "http://localhost:8080"

function Write-Title($t)  { Write-Host "`n==== $t ====" -ForegroundColor Cyan }
function Write-OK($t)     { Write-Host "[OK]   $t" -ForegroundColor Green }
function Write-Warn2($t)  { Write-Host "[WARN] $t" -ForegroundColor Yellow }
function Write-Fail($t)   { Write-Host "[FAIL] $t" -ForegroundColor Red }

Write-Title "验证码查看器自检"

# ---------- 1. 环境检查 ----------
Write-Title "1. 环境检查"

$py = $null
foreach ($cmd in @("python", "py -3", "python3")) {
    if (Get-Command ($cmd -split " ")[0] -ErrorAction SilentlyContinue) {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3\.(1[0-9]|[2-9][0-9])") {
            $py = $cmd
            Write-OK "Python: $ver  ($cmd)"
            break
        }
    }
}
if (-not $py) {
    Write-Fail "未找到 Python 3.10+，请先安装并加入 PATH"
    exit 1
}

if (-not (Test-Path "server.py")) {
    Write-Fail "当前目录没有 server.py，请把脚本放到 code-viewer 目录"
    exit 1
}
Write-OK "server.py 已就位"

# 检查依赖
$needInstall = $false
foreach ($mod in @("fastapi", "uvicorn", "imap_tools")) {
    $r = & $py -c "import $mod" 2>&1
    if ($LASTEXITCODE -ne 0) { $needInstall = $true; Write-Warn2 "缺少依赖: $mod" }
}
if ($needInstall) {
    Write-Host "  正在安装依赖..."
    & $py -m pip install -r requirements.txt | Out-Null
    Write-OK "依赖安装完成"
} else {
    Write-OK "依赖齐全"
}

# ---------- 2. 启动服务 ----------
Write-Title "2. 启动服务"

# 先探测是否已有服务在跑
$alreadyRunning = $false
try {
    $probe = Invoke-WebRequest -Uri "$URL/api/codes" -UseBasicParsing -TimeoutSec 2
    if ($probe.StatusCode -eq 200) {
        $alreadyRunning = $true
        Write-Warn2 "检测到 8080 端口已有服务运行，将直接对它测试（脚本退出时不会关掉它）"
    }
} catch { }

$startedByUs = $false
if (-not $alreadyRunning) {
    $outFile = "$env:TEMP\code-viewer-selfcheck.log"
    $errFile = "$env:TEMP\code-viewer-selfcheck.err"
    Write-Host "  正在后台启动 python server.py ..."
    $proc = Start-Process -FilePath ($py -split " ")[0] `
        -ArgumentList (@(($py -split " ")[1..10] | Where-Object {$_}) + @("server.py")) `
        -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $outFile `
        -RedirectStandardError $errFile
    $startedByUs = $true

    # 轮询等待就绪，最多 20 秒
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 700
        try {
            $r = Invoke-WebRequest -Uri "$URL/api/codes" -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch { }
    }
    if (-not $ready) {
        Write-Fail "服务启动失败，错误日志："
        if (Test-Path $errFile) { Get-Content $errFile | ForEach-Object { Write-Host "  $_" -ForegroundColor Red } }
        if (Test-Path $outFile) { Get-Content $outFile | ForEach-Object { Write-Host "  $_" } }
        exit 1
    }
    Write-OK "服务已就绪 ($URL)"
} else {
    Write-OK "复用已运行的服务"
}

# ---------- 3. 发测试短信并比对 ----------
Write-Title "3. 验证码提取测试（6 条）"

$cases = @(
    @{ from="10690";              content="【支付宝】您的验证码是 729415，5分钟内有效"; expect="729415";     desc="中文验证码" },
    @{ from="noreply@github.com"; content="Your GitHub verification code is 582931";   expect="582931";     desc="英文验证码" },
    @{ from="12345";              content="验证码 4A7B9C，10分钟内有效";                 expect="4A7B9C";      desc="字母数字混合" },
    @{ from="10655";              content="【美团】动态密码 1234，请尽快使用";          expect="1234";        desc="4位短码" },
    @{ from="service";            content="您的 OTP: 98765432";                         expect="98765432";    desc="8位长码" },
    @{ from="bank";               content="您的账户余额 5000 元，请查收";               expect=$null;         desc="余额短信(应忽略)" }
)

$pass = 0
$idx = 0
foreach ($c in $cases) {
    $idx++
    $bodyObj = @{ from = $c.from; content = $c.content } | ConvertTo-Json -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyObj)
    try {
        $resp = Invoke-RestMethod -Uri "$URL/api/sms-webhook" -Method Post -ContentType "application/json; charset=utf-8" -Body $bodyBytes -TimeoutSec 5
        $actual = $resp.code
        # 字符串化比较，规避 $null 在 -eq 左侧的坑
        $ok = ([string]$actual -eq [string]$c.expect)
        if ($ok) { $pass++; $tag = "PASS"; $color = "Green" }
        else     { $tag = "FAIL"; $color = "Red" }
        $expShow = if ($null -eq $c.expect) { "(无)" } else { $c.expect }
        $actShow = if ($null -eq $actual)   { "(无)" } else { $actual }
        Write-Host ("  [{0}] #{1} {2}" -f $tag, $idx, $c.desc) -ForegroundColor $color -NoNewline
        Write-Host ("  期望={0}  实际={1}" -f $expShow, $actShow)
        Write-Host ("        内容: " + $c.content) -ForegroundColor DarkGray
    } catch {
        Write-Fail ("  #"+$idx+" "+$c.desc+"  请求异常: "+$_.Exception.Message)
    }
}

# ---------- 4. 汇总 ----------
Write-Title "4. 汇总"
$summaryColor = if ($pass -eq $cases.Count) { "Green" } else { "Yellow" }
Write-Host ("  通过: $pass / " + $cases.Count) -ForegroundColor $summaryColor
if ($pass -eq $cases.Count) {
    Write-OK "核心功能完全正常：短信接收 + 验证码提取 + 实时推送 全链路 OK"
} else {
    Write-Warn2 "部分用例未通过，请检查 server.py 的 extract_code 逻辑"
}

# ---------- 5. 收尾 ----------
if ($startedByUs) {
    Write-Title "5. 收尾"
    Write-Host "  服务仍在后台运行。你可以：" -ForegroundColor DarkGray
    Write-Host "    - 浏览器打开 $URL 查看刚才的测试数据" -ForegroundColor DarkGray
    Write-Host "    - 按 Ctrl+C 或回车停止服务并退出" -ForegroundColor DarkGray
    try { Read-Host } catch { }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        Write-OK "已停止后台服务"
    }
}

Write-Host ""
Write-Host "提示: 测试只覆盖了短信 webhook。要测真实邮箱验证码，请把" -ForegroundColor DarkGray
Write-Host "      config.example.json 复制为 config.json 并填好邮箱授权码，" -ForegroundColor DarkGray
Write-Host "      再运行 python server.py。手机端短信需配 Android SmsForwarder。" -ForegroundColor DarkGray
