## 前言

2021 年双十一购买了 3 年的腾讯轻量应用服务器（2 核 4G），然后试着搭建了一套单机版私有化自动部署，本系列主要是记录搭建时所遇到的各种问题。

## 技术选型

1. 所有的环境都是基于 Docker 容器化部署部署，包括 Nginx 网关也采用了 Docker。
2. 由于服务器仅仅为 2 核 4G，所以都采用了轻量级的解决方案，整套方案部署成功后所占用的资源也不到 1G
   - 容器管理：Docker Compose 、 Portainer
   - 持续集成（CICD）： Drone
   - Git 仓库：Gitea
   - 容器仓库：Harbor
   - NPM 仓库：Verdaccio

## 基础设施

1. Ubuntu 服务器。我采用的是 Ubuntu Server 20.04 LTS 版本
2. SSH 和 FTP 远程工具。我采用的是 WindTerm（SSH）、WinSPC（FTP）
3. 已备案的域名。最好具有一个已经备案的域名，我在部署过程中使用到了 Https，并且使用了 Nginx 做网关。

[WinSPC](https://winscp.net/eng/index.php)
[WindTerm](https://github.com/kingToolbox/WindTerm)
