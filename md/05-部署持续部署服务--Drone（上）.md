# 持续部署概述

持续部署是能以自动化方式，频繁而且持续性的，将软件部署到生产环境。使软件产品能够快速迭代。

在之前部署 web 项目时，都是手动进行部署

拉取代码 ---> 编译项目 ---> 打包镜像 ---> 推送镜像仓库 ---> 服务器拉取新镜像 ---> 停止和移除旧容器 ---> 启动新容器

这一整套部署步骤枯燥又费时。

持续部署就是使用工具自动处理整套步骤。代码在提交之后自动执行整套流程将项目部署到生产环境，省去繁琐的人工操作。

持续部署整套流程本质上是一个极其简单的东西。可以拆解为两个阶段

1. 打包阶段： 拉取代码 ---> 编译项目 ---> 镜像打包 ---> 推送镜像仓库
2. 部署阶段： SSH 连接服务器 ---> 拉取新镜像 ---> 停止和移除旧容器 ---> 启动新容器

未使用自动化部署工具时，整套套也可以使用 **.sh** 脚本实现半自动化。甚至可以编写一个小程序，自动连接服务器实现全自动化。

而所谓的持续部署工具本质上做的也是这么一件事，只是提供了更强大更丰富的功能。

# Drone

持续部署工具一开始打算使用 `Gitlab`， `Gitlab` 中直接集成代码仓库和持续部署工具，用起来会方便很多，但部署完 `Gitlab` 发现小服务器真心扛不住。

后也考虑过大名鼎鼎的`jenkins`，查询资料发现 `Jenkins` 资源占用也挺大，最后选择了一个轻量级的工具 `Drone`

`Drone` 也是一个优秀、开源的持续部署工具，具有很高的关注度。https://github.com/harness/drone

不过稍微遗憾的是 `Drone` 社区不太完善。尤其国内，资料很少。折腾部署时利用 `Google` 搜索也耗费了不少时间。

## Drone 简介

`Drone` 应用由 `Server（服务器）` 和 `Runner（执行器）` 两种服务构成。

`Server（服务器）` 主要负责管理和展示， `Runner（执行器）` 主要负责执行操作。

### Server

`Server（服务器）` 负责的工作主要有

1. 连接集成代码仓库
2. 提供 web 管理页面
3. 管理 `Runner`

#### 代码仓库

`Drone` 可以无缝集成多种主流代码仓库，官方给出了具体的使用文档。

 <img src=./images/05/01.png width=50% />

#### 提供 Web 页面

`Server` 负责提供 web 管理页面显示执行情况。

#### 管理 Runner

`Server` 服务可以与一个或多个 `Runner` 连接通信进行管理。

### Runner

`Runner（执行器）` 是真正执行持续部署操作服务。`Runner` 执行时会轮询 `Server` 来确定执行的操作。

`Drone` 官方提供了多种类型的 `Runner（执行器）`，用于适配不同的运行环境。

<img src=./images/05/02.png width=50% />

`SSH Runner` 类型 `Runner` 可以使用容器化管理，所以可以使用 `Docker Runner` 代替。

`Drone` 提供了 `管道（Pipeline）` 机制，`管道（Pipeline）` 机制下一篇介绍

## Drone 部署

### Database

`Drone` 数据存储默认使用 `sqlite` 数据库。并且提供支持 `postgres` 和 `mysql`。

官方文档中强烈建议使用 `postgres` 而非 `mysql`。 某些操作在 `mysql` 未得到优化。 https://docs.drone.io/server/storage/database/

> PS: 支持 postgres9.6 及更高版本 、 mysql:5.6 及更高版本

### Gitea 配置

在此直接集成之前部署的 `Gitea` 仓库， 至于其它仓库，有兴趣的可以查询文档：https://docs.drone.io/server/overview/

部署 `Drone` 之前需要先在 `Gitea` 中添加一个 `OAuth` 登录密钥, `Drone` 使用的 `OAuth` 方式登录。

登录成功后重定向 URL 地址为 `Drone` 登录页。 **/login** 路由。

> PS：注意，此地址必须设置公网可访问地址。

将 **客户端 ID** 和 **客户端密钥** 保存。 **客户端 ID** 和 **客户端密钥** 需要在 `Drone` 配置中使用

<img src=./images/05/03.png width=50% />

<img src=./images/05/04.png width=50% />

### Dockerfile

```yml
version: '3.9'
# 创建自定义网络
networks:
  drone:
    name: drone
    driver: bridge
services:
  # 数据库服务
  db:
    image: postgres:latest
    container_name: drone_db
    restart: always
    networks:
      - drone # 加入到drone网络
    ports:
      - '7931:5432'
    environment:
      - POSTGRES_USER=drone # PGSQL默认用户
      - POSTGRES_PASSWORD=drone # PGSQL默认密码
      - POSTGRES_DB=drone # PGSQL默认数据库
    volumes:
      - /volumes/drone/db:/var/lib/postgresql/data
  # Drone Server 服务
  server:
    image: drone/drone:2.8.0 # 目前drone最新版本为 2.8.0
    container_name: drone_server
    restart: always
    networks:
      - drone # 加入到drone网络
    ports:
      - '7929:80'
    environment:
      - DRONE_SERVER_PROTO=http # 访问协议，创建webHooks和重定向
      - DRONE_SERVER_HOST=82.157.55.94:7929 # 主机名称，创建webHooks和重定向
      - DRONE_RPC_SECRET=e1ad8a7f3dbc68ca9c21bcc949335009 # 与 drone runner 通讯的密钥
      - DRONE_USER_CREATE=username:yxs970707,admin:true # 管理员账户
      - DRONE_DATABASE_DRIVER=postgres # 数据库类型
      - DRONE_DATABASE_DATASOURCE=postgres://drone:drone@db/drone?sslmode=disable # 数据库连接
      - DRONE_GIT_ALWAYS_AUTH=true # 使用 oauth 身份验证信息拉取代码
      - DRONE_GITEA_SERVER=https://gitea.mwjz.live # gitea服务器地址
      - DRONE_GITEA_CLIENT_ID=2c921d85-e40e-41f8-90e0-c77c383786b5 # gitea 客户端 id
      - DRONE_GITEA_CLIENT_SECRET=ZVZoRWK6jR5mqgAIm6sB5VX6C2LPK1sYKv4hQWyTdULu # gitea 客户端 密钥
      - DRONE_GITEA_SKIP_VERIFY=false # 禁用 gitea 链接时 tls 验证

    volumes:
      - /volumes/drone/server:/data
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - db
  # Drone Docker Runner
  runner:
    image: drone/drone-runner-docker:1.8.0 # 目前drone-runner-docker最新版本为 1.8.0
    container_name: drone_runner
    restart: always
    networks:
      - drone # 加入到drone网络
    ports:
      - '7930:3000'
    environment:
      - DRONE_RUNNER_NAME=docker-runner
      - DRONE_RUNNER_CAPACITY=10 # 限制runner可执行的并发管道数量
      - DRONE_RPC_PROTO=http # 访问drone server 协议
      - DRONE_RPC_HOST=server # 访问drone server 服务器地址
      - DRONE_RPC_SECRET=e1ad8a7f3dbc68ca9c21bcc949335009 # 与 drone server 通讯的密钥
      - DRONE_UI_USERNAME=yxs970707 # Drone Runner 的 UI 用户账号
      - DRONE_UI_PASSWORD=yxs970707 # Drone Runner 的 UI 用户密码
    volumes:
      - '/var/run/docker.sock:/var/run/docker.sock'
    depends_on:
      - server
```

`Dockerfile` 中部署了三个服务：

- **数据库(`postgres`)**
- **Server(`drone/drone:2.8.0`)**
- **Runner(`drone/drone-runner-docker:1.8.0`)**

数据库使用的是 `postgres`。三个服务之间通信使用的是自定义 `network`。

> PS： 多个应用服务可以共享同一个数据库服务，也可以创建独立的数据库服务。在当前服务器中，`Gitea` 应用和 `Drone` 应用创建了各自独立的数据库服务，这种方式会浪费一些服务器资源。但是维护起来比较方便。
> 具体采用哪种方案可以根据不同场景选择

部署 `Drone` 的 **environment** 属性有些麻烦，在此简单介绍下某些属性。

#### Server

##### DRONE_SERVER_PROTO 、 DRONE_SERVER_HOST

这两个属性是设置 `Webhook` 重定向 URL 的访问协议和主机名称。 `Webhook` 在下面会介绍到。

##### DRONE_RPC_SECRET

此属性是设置 `Server（服务器）` 与 `Runner（执行器）` 之间通讯的密钥，`Server（服务器）` 与 `Runner（执行器）` 必须设置相同的密钥值才允许通信。

可以在 **服务器(Linux)** 中使用 `openssl` 生成密钥

> openssl rand -hex 16

<img src=./images/05/05.png width=50% />

##### DRONE_USER_CREATE

此属性是设置 `Drone` 管理员。

注意：username 必须设置为 `OAuth` 用户（`Gitea` 的用户名），否则不具有管理员权限。

非管理员会少部分功能，例如不许设置 **Trusted** 属性

<img src=./images/05/06.png width=50% />

##### DRONE_DATABASE_DRIVER 、 DRONE_DATABASE_DATASOURCE

这两个属性是设置数据库类型和数据库连接。

具体连接配置可以参考[官方文档](https://docs.drone.io/server/reference/drone-database-datasource/)

##### DRONE_GIT_ALWAYS_AUTH

此属性是设置 `OAuth` 登录用户进行拉取代码

默认情况下 `OAuth` 只作用于登录操作。但存储库设置为私有时，需要登录用户才允许拉取代码，此时需要将此属性设置为 **true**

可以参考 https://discourse.drone.io/t/fatal-could-not-read-username-for/6198

默认值为 **false**

##### DRONE_GITEA_SERVER 、 DRONE_GITEA_CLIENT_ID 、DRONE_GITEA_CLIENT_SECRET

这几个属性是设置 `Gitea` 地址和 `OAuth` ID、密钥。

##### DRONE_GITEA_SKIP_VERIFY

此属性是设置禁用 `Gitea` 的 `TLS` 验证，

此属性为 **false** 时，当 `Gitea` 使用 `HTTPS` 协议但证书有问题，会出现授权验证失败，报 **x509** 错误。

下图是将 `网关（Nginx）` 中 `Gitea` 证书特意处理无效后进行的授权验证测试。 有兴趣的朋友可以自行测试。

<img src=./images/05/07.png width=50% />

当存储库使用 `HTTPS` 协议但没有证书情况下，此属性设置设置为 **true** 跳过 `TLS` 验证。

默认值为 **false**

#### Runner

##### DRONE_RUNNER_CAPACITY

此属性是设置 `Runner（执行器）` 并发管道数量

默认值为 **2**

##### DRONE_RPC_PROTO 、DRONE_RPC_HOST

这两个属性设置通信 `Server（服务器）` 的协议和主机名。 主机名使用 **server-name**

##### DRONE_UI_USERNAME、DRONE_UI_PASSWORD

`Runner（执行器）` 也具有 UI 展示页面，可以查看当前执行器的执行信息。这两个属性是设置 UI 展示页面的用户名称和密码

### 执行部署

使用 `Dockerfile` 进行部署，大概率不会出现问题，我进行了多次测试，

但部署 `Drone` 难免会碰到问题，每个人碰到的问题还不尽相同。所以需要善用 `Google` 查询

部署成功后访问，会跳转到欢迎页面，点击按钮就会进行 `Gitea` 登录

<img src=./images/05/08.png width=50% />

登录成功后会跳转到主页面，主页面上只有一项，就是 `Gitea` 中目前的存储库（web），这个存储库当前为未激活状态。

<img src=./images/05/09.png width=50% />

未激活情况下进入当前项目会跳转到 **settings** 页面，当前页面具有一个激活按钮，点击就可以激活此存储库

激活后会向 `Gitea` 注入一个 `Webhook`。

这个 `Webhook` 会监听仓库的变更情况，当代码仓库发生变化时， `Webhook`会向 `Drone` 推送消息。

`Drone` 接收到消息之后便可以执行，这也就是持续部署的第一步。

<img src=./images/05/10.png width=50% />

<img src=./images/05/11.png width=50% />

<img src=./images/05/12.png width=50% />

### Drone 设置

激活完毕之后 **settings** 页面就会出现很多设置

#### Protected

此属性是设置 是否要验证 `配置文件（.drone.yml）` 中的签名，开启后签名验证错误则不允许构建

#### Trusted

此属性设置是否允许使用挂载权限，挂载在之后会介绍。

不开通此权限，volumes 挂 host path 时报 Linter: untrusted repositories cannot mount host volumes 错误

注意：非管理员用户不具有此属性。

#### Auto cancel pushes、Auto cancel running

这两个属性是优化操作的属性。

开启这两个属性，当执行构建任务时，会自动取消之前未执行完毕的构建任务。

当合并多个 commit 时，这个属性具有很好的效果。

#### Timeout、Configuration

**timeout** 是设置构建任务执行的超时时间。

**Configuration** 是设置配置文件文件，默认为 **.drone.yml**。 这个一般不需要改动。

> PS: 注意：配置文件必须设置根目录

#### Secrets

**secrets** 是用来设置敏感属性的。

编写配置时，有些敏感数据需要隐藏，如账号密码，这些属性可以配置 **Secrets** 使用

<img src=./images/05/13.png width=50% />

### 测试执行

现在对 `Gitea` 中 **web** 项目提交就可以触发 `Webhook` 发送消息，

也可以在 `Gitea` 中主动触发 `Webhook`测试

但当前推送会返回一个 _context deadline exceeded (Client.Timeout exceeded while awaiting headers)_ 错误。

这个错误是因为根目录中没有找到 **配置文件(.drone.yml)**，

https://discourse.gitea.io/t/client-timeout-exceeded-while-awaiting-headers/4148/4

<img src=./images/05/14.png width=50% />

<img src=./images/05/15.png width=50% />

在根目录创建 **.drone.yml** 文件并添加了一个测试配置，配置文件中内容下一篇介绍

```yml
kind: pipeline # 定义一个管道
type: docker # 当前管道的类型
name: test # 当前管道的名称
steps: # 定义管道的执行步骤
  - name: test # 步骤名称
    image: node:latest # 当前步骤使用的镜像
    commands: # 当前步骤执行的命令
      - echo 测试drone执行
```

<img src=./images/05/16.png width=50% />

提交代码，`Webhook` 会主动推送到 `Drone`，`Drone` 会成功构建任务。

<img src=./images/05/17.png width=50% />

<img src=./images/05/18.png width=50% />

> PS：有可能还是会推送失败或者构建失败，可能会发生各种各样的问题。

在页面中， 具有两个 **steps**，这是因为默认第一个会拉取仓库代码，当然这个操作也可以禁用。

### 网关配置

```yml

server {
    #SSL 访问端口号为 443
    listen 443 ssl http2;
    #填写绑定证书的域名
    server_name drone.mwjz.live;
    #日志
    error_log /var/log/nginx/drone/error.log;
    access_log /var/log/nginx/drone/access.log;
    #证书文件
    ssl_certificate /etc/nginx/conf.d/ssl/drone/drone.mwjz.live_bundle.crt;
    #证书密钥文件
    ssl_certificate_key /etc/nginx/conf.d/ssl/drone/drone.mwjz.live.key;

    ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        proxy_pass http://10.0.24.12:7929;
    }
}
```

`Drone` 方面，我没有找到怎么修改配置，所以直接使用了暴力方式，重新部署。

部署的时候不需要清理 `volume`， 不清理重新部署还会保留之前的记录，当然也可以清理后重新部署。

如果没有删除 `volume`的话，需要在 `Gitea` 中手动修改一下 `Webhook` 的推送地址

```yml
server:
  image: drone/drone:2.8.0 # 目前drone最新版本为 2.8.0
  container_name: drone_server
  restart: always
  networks:
    - drone # 加入到drone网络
  ports:
    - '7929:80'
  environment:
    - DRONE_SERVER_PROTO=https # 访问协议，创建webHooks和重定向
    - DRONE_SERVER_HOST=drone.mwjz.live # 主机名称，创建webHooks和重定向
```

<img src=./images/05/20.png width=50% />

<img src=./images/05/19.png width=50% />

<img src=./images/05/21.png width=50% />

### 无证书 HTTPS 触发 Webhook

在部署时碰到这样一种情况，当 `Drone` 使用 `HTTPS` 但是没有证书情况下，`Webhook` 推送也会出现 **X509** 错误。

<img src=./images/05/22.png width=50% />

<img src=./images/05/23.png width=50% />

解决这个问题需要设置 `Gitea` 的配置, 在 **/data/gitea/conf/app.ini** 配置文件中设置跳过验证

```conf
[webhook]
SKIP_TLS_VERIFY = true
```

<img src=./images/05/24.png width=50% />

也可以在部署 `Gitea`时直接添加在 `Dockerfile` 中 **environment** 属性

```yml
#gitea服务
server:
  image: gitea/gitea:latest
  container_name: gitea_server
  restart: always
  environment:
    - GITEA__webhook__SKIP_TLS_VERIFY=true # webhook 跳过 tls 验证
    - GITEA__webhook__DELIVER_TIMEOUT=10 # webhook 超时时间
```
