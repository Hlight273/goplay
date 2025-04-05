chcp 65001
@echo off
cd ../

:: 询问用户是否安装依赖
set /p INSTALL_DEPENDENCIES=是否安装项目依赖？（y/n）:

:: 如果用户选择 'y'，则执行安装依赖
if /i "%INSTALL_DEPENDENCIES%"=="y" (
    echo 安装项目依赖...
    npm install
) else (
    echo 跳过依赖安装。
)

:: 运行构建命令
echo 开始编译项目...
npm run build

:: 打印编译输出的路径
set OUTPUT_DIR=dist
echo 编译完成，输出目录为 %OUTPUT_DIR%
pause

echo 准备传输dist静态文件包!
wsl rsync -av --delete %OUTPUT_DIR%/ root@IPPPPPPPPPPP:/usr/share/nginx/html/dist/
echo dist包传输完成!
pause