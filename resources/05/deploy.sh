#/bin/bash

# 拉取新镜像
docker pull yxs970707/deploy-web-demo:latest

#卸载旧容器
docker-compose -p web down

# 清除挂载信息
rm -rf  /volumes/web/html/*
rm -rf  /volumes/web/web/*
docker volume rm web-html
docker volume rm web-nginx

# 启动新容器
docker-compose -f /yml/docker-compose/web.yml -p web up -d

# 删除旧镜像
docker rmi $(docker images | grep deploy-web-demo | grep none | awk  '{print $3}')
