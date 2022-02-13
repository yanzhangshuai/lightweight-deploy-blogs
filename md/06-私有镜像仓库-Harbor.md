针对私有镜像仓库的问题，`Docker` 官方提供了搭建仓库服务的镜像服务：**[registry](https://hub.docker.com/_/registry)**，使用此镜像就可以部署私有仓库。

但官方提供的这个服务特别轻量化，甚至连 UI 管理页面都没有, 这也就带来了较高的管理维护成本。

针对这个问题开源社区有不少为 **[registry](https://hub.docker.com/_/registry)**  提供 UI管理 的项目，也有基于 **[registry](https://hub.docker.com/_/registry)**，二次开发的项目



其中基于 `registry` 二次开发的代表项目是 [Harbor](https://github.com/goharbor/harbor)， 也是企业级中比较常用的解决方案之一


# Harbor

## Harbor 概述

`Harbor` 项目是以 **[registry](https://hub.docker.com/_/registry)** 为基础的镜像仓库，另外提供了管理 UI, 基于角色的访问控制(Role Based Access Control)，AD/LDAP 集成、以及审计日志(Audit logging) 等企业用户需求的功能，同时还原生支持中文。

可以说 `Harbor` 提供了完备的管理系统以弥补 `registry` 的不足。

在资源占用方面 `Harbor` 也比较小。

## Harbor 部署

### Harbor 下载

`Harbor` 在 [Github](https://github.com/goharbor/harbor/releases) 中 提供了两种部署方式 
1. 离线安装
2. 在线安装

两种部署方式都以 `Docker Compose` 为基础的部署配置，不同的是 离线安装压缩包内包括了部署使用的镜像。

推荐本地下载离线版本，上传到服务器解压部署。

> sudo tar xf /tgz/harbor-offline-installer-v2.4.1.tgz

<img src=./images/06/01.png width=50% />

<img src=./images/06/02.png width=50% />

> PS：注意版本号


### Harbor 部署配置

**Harbor** 目录中两个关键文件是： **harbor.yml.tml** 和 **install.sh**。


**harbor.yml.tml** 是配置文件模板，需要将此文件改为 **harbor.yml**，部署时会使用 **harbor.yml** 配置文件。


**install.sh** 是执行文件，执行此文件就可以进行部署。


<img src=./images/06/03.png width=50% />


**harbor.yml** 配置文件中默认了许多属性，可以对需要的属性进行修改。

在此只列出了更改后的属性。

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

`Harbor` 应用的页面访问、 **拉取**、 **推送** 等操作 都是使用配置文件中 **hostname** 属性值， 所以在此一步到位设置了 `网关代理`。


> PS：`Harbor` 推荐使用 `HTTPS` 协议，在此使用了`网关`，所以只设置了 `HTTP` 协议

### 配置网关

`网关` 只需要配置 `Nginx` 属性即可。

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

此时，就可以执行 **install.sh** 文件进行部署


<img src=./images/06/04.png width=50% />
<img src=./images/06/05.png width=50% />

部署完成后，`Harbor` 会创建一个名为 **harbor** 的 `Docker Compose`

并且会启动 9 个容器服务。

让人头疼的是容器命名规则，并没有添加 **harbor** 前缀，对于强迫症来说真心难受。。。

<img src=./images/06/06.png width=50% />


部署完成后，访问 `Harbor` ，会跳转到登录页，使用 **管理员(admin)** 账号登录。

<img src=./images/06/07.png width=50% />

### Harbor 页面

`Harbor` 的主页面是 **项目** 模块。

**项目** 是一个镜像组，一个 **项目** 内可以存储多个镜像。


`Harbor` 默认创建了一个名为 **library** 的公开项目。

可以根据实际情况创建自己的项目


<img src=./images/06/08.png width=50% />


在此创建名为一个 **mwjz** 的私有项目，用来存储 **deploy-web-demo** 镜像

<img src=./images/06/09.png width=50% />
<img src=./images/06/10.png width=50% />

> PS: 其它模块可自行查看

## Harbor 持续集成
 
`Harbor` 镜像 拉取、推送 路径规则是： **主机名/项目/镜像名称**


也就是 **mwjz** 项目 **deploy-web-demo** 镜像拉取、推送的地址为： **docker.mwjz.live/mwjz/deploy-web-demo**

### 服务器配置

#### 更新 Docker Compose

**web** 项目 `Docker Compose` 文件中拉取镜像地址要改为 `Harbor` 仓库地址。

<img src=./images/06/11.png width=50% />


#### 登录 Harbor

`Harbor` 仓库 **mwjz** 是一个私有项目，需要登录才允许 拉取、推送。

服务器中测试拉取操作，不登录情况下会直接返回无权限错误。

<img src=./images/06/12.png width=50% />


使用 `Docker` 登录 `Harbor` 仓库时，注意 必须使用 `sudo` 或者 `root` 用户登录，否则其它用户无法使用此登录凭证

> 注意：必须使用 `sudo` 或者 `root` 用户登录，否则其它用户无法使用此登录凭证

<img src=./images/06/13.png width=50% />


`Harbor` 仓库登录成功后， `Docker` 会在 **/root/.docker/config.json** 文件中添加当前仓库的登录凭证。

 `Drone` 持续集成需要使用到此登录凭证。

<img src=./images/06/13_02.png width=50% />

<img src=./images/06/14.png width=50% />

### Drone 配置

#### Secret配置

1. 镜像拉取登录凭证

    `Drone` 引擎中容器是一个纯净的运行环境，无法直接使用服务器的登录凭证拉取私有仓库镜像。


    针对这个问题， `Drone` 预定义了一个 **image_pull_secrets** 属性，**image_pull_secrets** 会从 `Secret` 读取仓库登录凭证，执行登录操作。

    也就是需要在 `Secret` 配置仓库登录凭证信息：**docker_auth_config**，属性值就是 **/root/.docker/config.json** 文件内容。

    <img src=./images/06/16.png width=50% />

    > PS： 注意，登录凭证必须使用  `sudo` 或 `root` 用户登录，否则不具有拉取权限

2. 镜像推送账号
  
    将 **docker_username**、 **docker_password** 两个 `Secret` 属性值改为 `Harbor` 仓库的账号密码。



#### .drone.yml 配置


**.drone.yml** 文件主要的改动点是 镜像名称 和 仓库地址

1. build-image 步骤：
   
    将 **repo** 属性值设置为 **docker.mwjz.live/mwjz/deploy-web-demo**， 

   并添加 **registry** 属性， 属性值为 **docker.mwjz.live（`Harbor` 仓库 hostname)**

2. deploy-project 步骤 
  
    将镜像拉取地址修改为 **docker.mwjz.live/mwjz/deploy-web-demo**

3. deploy 管道：
    
     需要在 **deploy** 管道中设置 私有仓库登录凭证密钥属性：**image_pull_secrets**

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

### 执行测试

全部准备完成后， 可以修改项目版本号，进行测试构建。

构建时可能还会有其它问题，但一般都是小问题，可以检查配置或查询 `Google` 解决。

实在解决不了可以留言。

<img src=./images/06/15.png width=50% />

<img src=./images/06/17.png width=50% />

<img src=./images/06/18.png width=50% />

<img src=./images/06/19.png width=50% />
