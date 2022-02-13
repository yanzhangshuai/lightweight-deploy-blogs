`Docker` 官方提供了一个搭建私有化镜像仓库的服务：**[registry](https://hub.docker.com/_/registry)**，可以直接拉取此镜像部署私有化仓库。

不过这个服务 在管理功能上有很多不足，比如连 UI 管理页面都没有，维护起来较为麻烦，所以一般情况不会直接使用此服务。

开源社区也有其它比较好用的私有化镜像仓库项目，企业级比较流行的是 [Harbor](https://github.com/goharbor/harbor) 


# Harbor

## Harbor 概述

`Harbor` 项目是以 **[registry](https://hub.docker.com/_/registry)** 为基础的镜像仓库，

另外提供了管理 UI, 基于角色的访问控制(Role Based Access Control)，AD/LDAP 集成、以及审计日志(Audit logging) 等企业用户需求的功能，同时还原生支持中文。

可以说 `Harbor` 提供了完备的管理系统，使用起来较为方便，并且资源占用也比较小。

## Harbor 部署

### Harbor 下载

[Github](https://github.com/goharbor/harbor/releases) 中 提供了两种部署方式 
1. 离线安装
2. 在线安装

这两种部署方式都是提供了一个完备的 `Docker Compose` 部署配置，只需要简单的配置就可以执行部署。

比较推荐还是本地下载离线版本，然后上传服务器解压部署。

> sudo tar xf /tgz/harbor-offline-installer-v2.4.1.tgz

<img src=./images/06/01.png width=50% />

<img src=./images/06/02.png width=50% />

> PS：注意版本


### Harbor 部署配置

解压完成后 在**harbor** 目录会有 **harbor.yml.tml** 和 **install.sh** 两个文件


**harbor.yml.tml** 是部署配置文件模板，需要将此文件改为 **harbor.yml**，部署时会读取 **harbor.yml** 文件中配置。


**install.sh** 是执行文件，执行此文件就会执行部署。


<img src=./images/06/03.png width=50% />


**harbor.yml** 配置文件中默认了许多属性，可以对一些属性进行修改。

在此列出了我更改的属性，未修改的属性没有列出。

```yml
# 设置访问地址，可以使用ip、域名，不可以设置为127.0.0.1或localhost。
# 访问地址
hostname: docker.mwjz.live

# HTTP 访问协议设置
http:
  # http访问端口号
  port: 8433

# 禁用HTTPS协议访问
#https:
# https port for harbor, default is 443
#  port: 443
# The path of cert and key files for nginx
#  certificate: /your/certificate/path
#  private_key: /your/private/key/path

# admin 用户密码
harbor_admin_password: XXXXXXX

# 数据库设置
database:
  # 数据库密码
  password: XXXXXX

# Harbor数据挂载目录
data_volume: /volumes/harbor
```

`Harbor` 页面访问和 **拉取**、 **推送** 操作 都是使用的配置文件中 **hostname** 属性， 在此一步到位设置为域名。


> PS：`Harbor` 推荐使用 `HTTPS` 协议，但因为使用了`网关`，所以只设置了 `HTTP` 协议

### 配置网关

`网关` 配置就不介绍，只列出 `Nginx` 配置属性

```yml
server {
    #SSL 访问端口号为 443
    listen 443 ssl http2;
    #填写绑定证书的域名
    server_name docker.mwjz.live;
    #上传大小限制
    client_max_body_size 3000M;
    #日志
    error_log /var/log/nginx/docker/error.log;
    access_log /var/log/nginx/docker/access.log;
    #证书文件
    ssl_certificate /etc/nginx/conf.d/ssl/docker/docker.mwjz.live_bundle.crt;
    #证书密钥文件
    ssl_certificate_key /etc/nginx/conf.d/ssl/docker/docker.mwjz.live.key;

    ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        proxy_pass http://10.0.24.12:8433;
    }
}

```

<img src=./images/06/03_01.png width=50% />

<img src=./images/06/03_02.png width=50% />

重启网关服务

> docker exec -it gateway nginx -s reload

### 执行部署

准备就绪后，就可以执行 **install.sh** 文件进行部署


<img src=./images/06/04.png width=50% />
<img src=./images/06/05.png width=50% />

部署完成后，`Harbor` 会启动 9 个容器服务。让人头疼的是容器命名，没有 **harbor** 前缀。

<img src=./images/06/06.png width=50% />


此时就可以访问 `Harbor` ，第一次访问会跳转到登录页。

可以使用 **admin** 账号登录。

<img src=./images/06/07.png width=50% />

### Harbor 页面

登录成功后， 会跳转到 **主页面(项目标签模块)** 。

在 **项目模块** 中有一个默认 **library** 项目。

**项目** 可以理解为一个镜像组，一个 **项目** 中可以存储多个镜像。

<img src=./images/06/08.png width=50% />


在此创建一个 **mwjz** 私有项目，用来存储 **deploy-web-demo** 镜像

<img src=./images/06/09.png width=50% />
<img src=./images/06/10.png width=50% />

> PS: 其它模块可自行查看

## Harbor 持续集成
 
`Harbor` 镜像 拉取、推送 路径规则是： **主机名/项目/镜像名称**

也就是当 **deploy-web-demo** 镜像要存储在 `Harbor` 仓库 **mwjz** 项目时，拉取 和 推送的路径为： **docker.mwjz.live/mwjz/deploy-web-demo**

### 服务器设置

#### 更新 Docker Compose

以后持续集成中的镜像拉取就改为 `Harbor` 仓库。

预先修改下 **web** 项目  `Docker Compose` 镜像拉取地址。

<img src=./images/06/11.png width=50% />


#### 登录 Harbor

`Harbor` 仓库 **mwjz** 是一个私有项目，需要登录才允许 拉取、推送。

不登录拉取镜像时会直接返回无权限错误。

<img src=./images/06/12.png width=50% />


在服务器中使用 `Docker` 中登录 `Harbor` 仓库

> 注意：必须使用 `sudo` 或者 `root` 用户登录，否则其它用户无法使用此登录凭证

<img src=./images/06/13.png width=50% />

仓库登录成功后 `Docker` 会向 **/root/.docker/config.json** 文件中添加仓库的登录凭证


这个登录凭证在 `Drone` 拉取私有镜像时会使用到。


<img src=./images/06/13_01.png width=50% />

<img src=./images/06/13_02.png width=50% />


仓库登录成功后，再次拉取私有镜像就不会再返回权限错误

<img src=./images/06/14.png width=50% />

### Drone 配置

#### Secret配置

1. 镜像拉取登录凭证

    `Drone` 引擎启动的容器是一个新的环境，无法直接使用服务器的登录凭证 。


    针对这个问题， `Drone` 预定义了一个 **image_pull_secrets** 属性。


    **image_pull_secrets** 可以从 `Secret` 读取私有仓库登录凭证。

    也就是需要在 `Secret` 中配置登录凭证信息属性：**docker_auth_config**

    属性值就是 **/root/.docker/config.json** 文件内容。

    <img src=./images/06/16.png width=50% />

    > PS： 注意，登录凭证必须使用  `sudo` 或 `root` 用户登录，否则不具有拉取权限

2. 镜像推送账号
  
    将 **docker_username**、 **docker_password** 两个 `Secret` 属性值设置为私有镜像仓库信息。



#### .drone.yml 配置


**.drone.yml** 配置文件中的修改主要是将镜像名称和地址都改为 `Harbor` 仓库

1. **build-image** 步骤：
   
    将 **repo** 属性配置为 **docker.mwjz.live/mwjz/deploy-web-demo** 

   并且需要添加 **registry** 属性， 属性值为 **docker.mwjz.live（`Harbor` 仓库 hostname)**

2. **deploy-project** 步骤 
  
    将镜像拉取的地址修改为 **docker.mwjz.live/mwjz/deploy-web-demo**

3. **deploy** 管道：
    
     需要设置私有镜像拉取的登录凭证密钥属性：**image_pull_secrets**

```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: build              # 定义管道名称

steps:
- name: build-image     # 步骤名称
    image: plugins/docker # 使用镜像
    depends_on: [build-tags, build-project] # 依赖步骤
    settings:             # 当前设置
      username:           # 账号名称
        from_secret: docker_username
      password:           # 账号密码
        from_secret: docker_password
      dockerfile: deploy/Dockerfile # Dockerfile地址， 注意是相对地址
      registry: docker.mwjz.live  # 私有镜像仓库地址
      repo: docker.mwjz.live/mwjz/deploy-web-demo # 镜像名称

---

kind: pipeline
type: docker
name: deploy


image_pull_secrets: # 私有镜像拉取凭证密钥
  - docker_auth_config

steps:

  - name: deploy-project
    image: appleboy/drone-ssh
    settings:
      host:
        from_secret: server_host
      user:
        from_secret: server_username
      password:
        from_secret: server_password
      port: 22
      # insecure: false  如果拉取的镜像地址使用的是http协议,则将此属性设置为true
      command_timeout: 3m
      script:
        - echo ====开始部署=======
        - docker pull docker.mwjz.live/mwjz/deploy-web-demo:latest
        - docker-compose -p web down
        - docker volume rm web-nginx
        - docker-compose -f /yml/docker-compose/web.yml -p web up -d
        - docker rmi $(docker images | grep deploy-web-demo | grep none | awk  '{print $3}')
        - echo ====部署成功=======
```

### 提交测试

全部准备完成后就可以修改项目版本号，然后可以提交测试构建。

构建时可能会有些问题，但一般都是小问题，可以检查配置或查询 `Google` 解决。

实在解决不了可以留言，如果我知道问题可以帮忙。

<img src=./images/06/15.png width=50% />

<img src=./images/06/17.png width=50% />

<img src=./images/06/18.png width=50% />

<img src=./images/06/19.png width=50% />
