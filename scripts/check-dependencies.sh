#!/bin/bash

check_and_install() {
    # 检查 SANE 是否已安装
    if ! command -v scanimage &> /dev/null; then
        echo "正在安装 SANE..."
        sudo apt-get update
        sudo apt-get install -y sane sane-utils libsane-dev
    fi

    # 检查 XSane 是否已安装
    if ! command -v xsane &> /dev/null; then
        echo "正在安装 XSane..."
        sudo apt-get install -y xsane
    fi

    # 添加用户到scanner组
    sudo usermod -a -G scanner $USER

    echo "依赖检查和安装完成！"
}

check_and_install