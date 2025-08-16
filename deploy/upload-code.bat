@echo off
REM 📦 Windows 代码上传脚本
REM 在项目根目录的 PowerShell 或 CMD 中运行

echo 📦 Windows 代码上传工具
echo ====================

if "%1"=="" (
    echo ❌ 用法：%0 ^<服务器IP地址^>
    echo.
    echo 示例：
    echo   %0 8.138.115.181
    echo.
    pause
    exit /b 1
)

set SERVER_IP=%1
set PROJECT_PATH=%CD%

echo 🔍 检查项目目录...
if not exist "%PROJECT_PATH%\package.json" (
    echo ❌ 错误：在当前目录中未找到 package.json 文件
    echo 💡 请确保在 Next.js 项目根目录中运行此脚本
    pause
    exit /b 1
)

echo ✅ 找到 Next.js 项目：%PROJECT_PATH%
echo 📡 目标服务器：%SERVER_IP%
echo.

set /p CONFIRM="🤔 确认上传项目到服务器？ [y/N]: "
if /i not "%CONFIRM%"=="y" (
    echo ❌ 取消上传
    pause
    exit /b 0
)

echo 📦 开始上传代码...

REM 创建服务器目录
echo 📁 创建服务器目录...
ssh root@%SERVER_IP% "mkdir -p /var/www/social"

REM 压缩项目（排除不需要的文件）
echo 📦 压缩项目文件...
powershell -Command "& {Get-ChildItem -Path . -Recurse | Where-Object {$_.FullName -notmatch '\\node_modules\\|\\\.git\\|\\\.next\\|\\\.env$'} | Compress-Archive -DestinationPath social-upload.zip -Force}"

if not exist "social-upload.zip" (
    echo ❌ 压缩失败
    pause
    exit /b 1
)

REM 上传压缩文件
echo 📤 上传压缩包...
scp social-upload.zip root@%SERVER_IP%:/tmp/

if errorlevel 1 (
    echo ❌ 上传失败
    del social-upload.zip
    pause
    exit /b 1
)

REM 在服务器解压
echo 📂 在服务器解压...
ssh root@%SERVER_IP% "cd /var/www/social && unzip -o /tmp/social-upload.zip && rm /tmp/social-upload.zip && chown -R root:root /var/www/social"

REM 清理本地临时文件
del social-upload.zip

echo.
echo ✅ 代码上传成功！
echo ==================
echo.
echo 📋 接下来的步骤：
echo 1. 连接到服务器：
echo    ssh root@%SERVER_IP%
echo.
echo 2. 进入项目目录：
echo    cd /var/www/social
echo.
echo 3. 运行环境安装脚本：
echo    chmod +x deploy/setup.sh
echo    ./deploy/setup.sh
echo.
echo 4. 配置环境变量：
echo    cp .env.example .env.production
echo    vim .env.production
echo.
echo 5. 运行部署脚本：
echo    chmod +x deploy/deploy.sh
echo    ./deploy/deploy.sh
echo.
pause
