@echo off
chcp 65001 >nul
REM ============================================================
REM  验证码实时查看器 - Windows 打包脚本
REM  产物: dist\code-viewer.exe （单文件，无需装 Python 即可运行）
REM  用法: 双击本文件，或在命令行运行 build-windows.bat
REM ============================================================

cd /d "%~dp0"

echo ============================================================
echo   验证码实时查看器 - Windows 打包
echo ============================================================

REM ---- 检查 Python ----
where python >nul 2>nul
if errorlevel 1 (
    echo [错误] 未找到 python，请先安装 Python 3.10+ 并勾选 "Add to PATH"
    echo        下载: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo [1/3] 安装项目依赖...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [错误] 安装依赖失败
    pause
    exit /b 1
)

echo.
echo [2/3] 安装 PyInstaller...
python -m pip install pyinstaller
if errorlevel 1 (
    echo [错误] 安装 PyInstaller 失败
    pause
    exit /b 1
)

echo.
echo [3/3] 开始打包（约 1-2 分钟）...
pyinstaller --onefile --name code-viewer ^
  --add-data "templates\index.html;templates" ^
  --collect-submodules imap_tools ^
  --collect-submodules uvicorn ^
  --collect-submodules starlette ^
  --collect-submodules fastapi ^
  --hidden-import uvicorn.logging ^
  --hidden-import uvicorn.loops.auto ^
  --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import uvicorn.protocols.websockets.auto ^
  --hidden-import uvicorn.lifespan.on ^
  --clean --noconfirm ^
  server.py
if errorlevel 1 (
    echo [错误] 打包失败
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   打包完成！
echo.
echo   产物:  dist\code-viewer.exe
echo.
echo   使用步骤:
echo     1. 把 dist\code-viewer.exe 和 config.example.json
echo        复制到同一目录（比如桌面新建文件夹）
echo     2. 把 config.example.json 改名为 config.json
echo     3. 用记事本打开 config.json，填好邮箱授权码和 webhook_token
echo     4. 双击 code-viewer.exe 运行
echo     5. 浏览器打开 http://localhost:8080
echo.
echo   手机端: Android 装 SmsForwarder，webhook 地址填
echo     http://<电脑IP>:8080/api/sms-webhook?token=<你的token>
echo ============================================================
pause
