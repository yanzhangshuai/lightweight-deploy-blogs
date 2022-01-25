# 什么是自动化部署

持续部署是能以自动化方式，频繁而且持续性的，将软件部署到生产环境。使软件产品能够快速迭代。


之前部署 web 项目

打包项目 ---> 打包镜像 ---> 推送镜像 ---> 服务器拉取新镜像 ---> 停止旧容器 ---> 启动新容器

这一整整套部署步骤枯燥又费时。

自动化部署就是使用工具自动处理整套步骤。代码在提交之后自动执行这一套操作部署到生产环境。

自动化部署工具最流行的商业级工具就是大名鼎鼎的 `jenkins`。

自动化部署这一套流程本质上却是一个极其简单的东西。可以拆解为两个步骤

1. 监听代码仓库提交，拉取最新代码，进行项目打包，镜像打包，推送到 镜像仓库
2. 使用SSH连接服务器，拉取最新镜像，停止移除旧容器，启动新容器。

未使用自动化部署工具时，这一套也可以利用 **.sh** 脚本实现半自动化。甚至可以编写一个小程序，自动连接SSH，实现全自动化。

而所谓的自动化部署工具干的就是这样一件事情


自动化部署本质上只是将手动执行的指令通过程序自动执行，省去了繁琐的人工操作。

# Drone

自动化部署工具一开始是想用 `Gitlab`，直接集成代码仓库和自动化部署，但是部署完才发现小服务器真心扛不住。

后也考虑过 `jenkins`，但是查询到资源占用也很大，最后选择了一个轻量级的工具 `Drone`

`Drone` 也是一个优秀且开源的自动化部署工具， 
代码存储在 [`Github`](https://github.com/harness/drone)，也具有很高的关注度。


不过遗憾的是社区不太完善，尤其国内，网上资料很少。折腾时利用 `Google搜索` 也耗费了不少的时间。 

## Drone 简介

`Drone` 由 `Server` 和 `Runner` 两部分构成， `Server` 主要负责管理， `Runner` 主要负责真正执行配置。

### Server

`Server` 负责的工作主要有 

1. 集成代码仓库
2. 提供 web 管理页面
3. 管理 `Drone Runner`

#### 集成代码仓库

`Drone` 支持集成多种目前主流的代码仓库，官方给出了无缝集成的代码仓库和具体使用文档。

 <img src=./images/05/01.png width=50% />


#### 提供 Web 页面

`Server` 负责提供 web 管理页面展示执行信息和进行操作

#### 管理 Runner
`Server` 还负责管理一个或多个 `Runner`。 

### Runner

`Runner` 是真正执行持续部署操作的执行器。会轮询 `Server` 的方式确定要执行的操作。

`Drone` 官方提供了多种 `Runner`，用于适配不同的运行环境。

在此会使用 `Docker Runner` 

<img src=./images/05/02.png width=50% />



`Drone` 提供了 `管道（Pipeline）` 机制，`管道（Pipeline）` 机制下一篇介绍

## Drone 部署

### Database

`Drone` 默认使用 `sqlite` 数据库进行数据存储，并且支持 `postgres` 和 `mysql`。

官方文档中强烈建议使用 `postgres` 而非 `mysql`。 一些优化操作并没有在 `mysql` 中实现 。

https://docs.drone.io/server/storage/database/

> PS: 支持 postgres9.6及更高版本 、 mysql:5.6及更高版本


### Gitea 配置 

在此直接集成 `Gitea`，至于其它仓库，有兴趣的可以查询文档：https://docs.drone.io/server/overview/


部署之前需要先在 `Gitea` 中设置 `OAuth` 权限, `Drone` 使用的是 `OAuth` 方式登录

重定向URL 地址设置为 `Drone` 的登录页。 **/login** 路由。

>PS：注意，此地址必须设置公网可访问地址。


将 **客户端ID** 和 **客户端密钥** 保存。 **客户端ID** 和 **客户端密钥** 需要在 `Drone` 配置中使用

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
      - drone  # 加入到drone网络
    ports: 
      - '7931:5432'
    environment:
      - POSTGRES_USER=drone             # PGSQL默认用户
      - POSTGRES_PASSWORD=drone         # PGSQL默认密码
      - POSTGRES_DB=drone               # PGSQL默认数据库
    volumes:
      - /volumes/drone/db:/var/lib/postgresql/data
  # Drone Server 服务
  server:   
    image: drone/drone:2.8.0           # 目前drone最新版本为 2.8.0
    container_name: drone_server
    restart: always
    networks: 
      - drone  # 加入到drone网络
    ports:
      - '7929:80'
    environment:
      - DRONE_SERVER_PROTO=http                                                   # 访问协议，创建webHooks和重定向
      - DRONE_SERVER_HOST=82.157.55.94:7929                                       # 主机名称，创建webHooks和重定向
      - DRONE_RPC_SECRET=e1ad8a7f3dbc68ca9c21bcc949335009                         # 与 drone runner 通讯的密钥 
      - DRONE_USER_CREATE=username:yxs970707,admin:true                           # 管理员账户
      - DRONE_DATABASE_DRIVER=postgres                                            # 数据库类型
      - DRONE_DATABASE_DATASOURCE=postgres://drone:drone@db/drone?sslmode=disable # 数据库连接
      - DRONE_GIT_ALWAYS_AUTH=true                                                # 使用 oauth 身份验证信息拉取代码
      - DRONE_GITEA_SERVER=https://gitea.mwjz.live                                # gitea服务器地址
      - DRONE_GITEA_CLIENT_ID=2c921d85-e40e-41f8-90e0-c77c383786b5                # gitea 客户端 id
      - DRONE_GITEA_CLIENT_SECRET=ZVZoRWK6jR5mqgAIm6sB5VX6C2LPK1sYKv4hQWyTdULu    # gitea 客户端 密钥
      - DRONE_GITEA_SKIP_VERIFY=false                                              # 禁用 gitea 链接时 tls 验证
   
    volumes:
      - /volumes/drone/server:/data
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - db
  # Drone Docker Runner
  runner:
    image: drone/drone-runner-docker:1.8.0  # 目前drone-runner-docker最新版本为 1.8.0
    container_name: drone_runner
    restart: always
    networks: 
      - drone  # 加入到drone网络
    ports:
      - '7930:3000'
    environment:
      - DRONE_RUNNER_NAME=docker-runner
      - DRONE_RUNNER_CAPACITY=10                                                  # 限制runner可执行的并发管道数量
      - DRONE_RPC_PROTO=http                                                      # 访问drone server 协议
      - DRONE_RPC_HOST=server                                                     # 访问drone server 服务器地址
      - DRONE_RPC_SECRET=e1ad8a7f3dbc68ca9c21bcc949335009                         # 与 drone server 通讯的密钥 
      - DRONE_UI_USERNAME=yxs970707                                               # Drone Runner 的 UI 用户账号
      - DRONE_UI_PASSWORD=yxs970707                                               # Drone Runner 的 UI 用户密码
    volumes:
      - '/var/run/docker.sock:/var/run/docker.sock'
    depends_on:
      - server
```

以上是部署 `Drone` 的 `Dockerfile`。


在 `Dockerfile` 中一共部署了三个服务： 
* **数据库(`postgres`)**
* **Server(`drone/drone:2.8.0`)**
* **Runner(`drone/drone-runner-docker:1.8.0`)**

数据库使用的为 `postgres`。三个服务之间通信使用的是自定义 `network`

`Drone` 中的 **environment** 稍微有些麻烦，在此简单说一下重要的参数

#### Server


##### DRONE_SERVER_PROTO 、 DRONE_SERVER_HOST


这两个参数是设置  `Webhook` 重定向 URL 的访问协议和主机名称，就是 `Gitea` 中设置的 `Drone` 地址


##### DRONE_RPC_SECRET

这个属性是设置  **Server** 与 **Runner** 通讯的共享密钥， **Server** 与 **Runner** 必须设置相同的密钥值才允许通信。

可以在服务器中使用 `openssl` 生成密钥

> openssl rand -hex 16

<img src=./images/05/05.png width=50% />

##### DRONE_USER_CREATE

这个属性是设置 `Drone` 管理员。

注意：username必须设置和申请OAuth账户（也就是 `Gitea` 的用户名）一致，否则不具有管理员权限。

非管理员会少部分功能，例如不许设置 **Trusted** 属性

<img src=./images/05/06.png width=50% />



##### DRONE_DATABASE_DRIVER 、 DRONE_DATABASE_DATASOURCE

这两个参数是设置数据库类型和数据库连接。 

具体连接配置可以参考[官方文档](https://docs.drone.io/server/reference/drone-database-datasource/)

##### DRONE_GIT_ALWAYS_AUTH

这个参数是设置使用 `OAuth` 验证的用户进行拉取代码

默认情况下 `OAuth` 验证只用于登录。但在存储库设置为私有时，需要验证用户才允许拉取代码，这时候需要将此参数设置为 **true**

可以参考 https://discourse.drone.io/t/fatal-could-not-read-username-for/6198

默认值为 **false**

##### DRONE_GITEA_SERVER 、 DRONE_GITEA_CLIENT_ID 、DRONE_GITEA_CLIENT_SECRET

这几个参数是设置 `Gitea` 地址和 `OAuth` ID、密钥。


##### DRONE_GITEA_SKIP_VERIFY

这个参数是设置禁用 `Gitea` 链接时的 `TLS` 验证，

此属性为 **false** 时，如果 `Gitea` 使用了 `HTTPS` 协议，但是证书有问题，授权时验证失败，会报 **x509** 错误。

下图是将  `网关（Nginx）` 中 `Gitea` 证书特意处理为无效后进行的授权验证。 有兴趣的朋友可以自行测试。

<img src=./images/05/07.png width=50% />

当使用 `HTTPS` 协议但是没有证书时，此属性可以设置为 **true**

默认值为 **false**


#### Runner

##### DRONE_RUNNER_CAPACITY

这个属性是设置 **Runner** 执行的并发管道数量

默认值为 **2**

##### DRONE_RPC_PROTO 、DRONE_RPC_HOST
这两个属性设置 **Runner** 连接 **Server** 的协议和主机名。 主机名使用 **server-name**

##### DRONE_UI_USERNAME、DRONE_UI_PASSWORD

**Drone Runner** 也具有 UI 展示页面，可以查看 **Runner** 的执行信息。这两个属性是设置 UI 展示页面的用户名称和密码


### 执行部署

使用 `Dockerfile` 进行部署，大概率不会出现问题，我进行了多次测试，


但部署 `Drone` 难免会碰到问题，每个人需要的问题还不尽相同。所以要善于 `Google` 查询


部署成功后访问，会跳转到欢迎页面，点击按钮就会进行 `Gitea` 验证

<img src=./images/05/08.png width=50% />

验证成功后会跳转到主页面，页面上具有一项，这个就是 `Gitea` 中目前的一个存储库（web），这个存储库在 `Drone` 属于未激活状态。

<img src=./images/05/09.png width=50% />

未激活情况下进入当前项会跳转到 **settings** 页面，当前页面具有一个激活的按钮，点击就可以将此存储库激活


激活后会向 `Gitea` 注入一个 `Webhook`。这个 `Webhook` 会监听仓库的变更情况。

当仓库代码发生变化 `Webhook`会自动推送消息到 `Drone` `Drone` 接收到消息之后便可以执行。

这也就是自动化部署的第一步。

<img src=./images/05/10.png width=50% />

<img src=./images/05/11.png width=50% />

<img src=./images/05/12.png width=50% />


### Drone 设置

激活完毕之后 **settings** 页面会多许多配置。

#### Protected

这个属性是设置 是否要验证配置文件（`.drone.yml`）中的签名，签名不正确不允许构建

####  Trusted

这个属性是给代码仓库挂载权限。

不开通此权限，volumes挂host path时报Linter: untrusted repositories cannot mount host volumes错误

注意：非管理员用户不具有此属性。

#### Auto cancel pushes、Auto cancel running

这两个属性是优化操作的属性。

开启这两个属性，当执行构建任务时，会自动取消之前未执行完毕的构建任务。

当合并了多个commit时，这个属性具有很好的效果。

#### Timeout、Configuration

**timeout** 是设置构建任务执行的超时时间。

**Configuration** 是设置配置文件文件，默认为 **.drone.yml**。 这个一般不需要改动。

>PS: 注意：配置文件必须设置根目录


#### Secrets

这是设置敏感属性的

编写配置时，有些信息例如账号密码需要进行隐藏，便可以配置 **Secrets** 


<img src=./images/05/13.png width=50% />


### 测试执行

现在对 `Gitea` 中 **web** 项目提交代码就可以触发 `Webhook` 发送消息，也可以在 `Gitea` 主动触发 `Webhook`测试

但是此时触发会返回一个 *context deadline exceeded (Client.Timeout exceeded while awaiting headers)* 错误。

这是因为根目录中没有找到配置文件的原因 **.drone.yml**，

https://discourse.gitea.io/t/client-timeout-exceeded-while-awaiting-headers/4148/4


<img src=./images/05/14.png width=50% />

<img src=./images/05/15.png width=50% />


在根目录创建 **.drone.yml** 文件并添加了一个测试代码

```yml
kind: pipeline          # 定义一个管道
type: docker            # 当前管道的类型
name: test              # 当前管道的名称
steps:                  # 定义管道的执行步骤
  - name: test          # 步骤名称
    image: node:latest  # 当前步骤使用的镜像
    commands:           # 当前步骤执行的命令
      - echo 测试drone执行
```

<img src=./images/05/16.png width=50% />

然后提交代码，`Webhook` 就会推送成功，并且`Drone` 会成功的构建任务。


<img src=./images/05/17.png width=50% />

<img src=./images/05/18.png width=50% />

> PS：有可能还是会推送失败或者构建失败，因为可能会发生各种各样的问题。

在页面中， 具有两个 **steps**，这是因为默认第一个会拉取仓库代码，当然这个操作也可以禁用。


###  网关配置

`网关` 配置第一步还是配置 `Nginx` 配置

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

`Drone` 方面，我没有找到怎么修改配置，所以用了暴力的办法，重新部署。

部署的时候不需要清理Volume， 如果不清理重新部署还会保留之前的记录，当然也可以全部重新部署。

如果没有删除 `Volume`的话，需要手动修改一下 `Webhook` 的推送地址

```yml
server:   
  image: drone/drone:2.8.0           # 目前drone最新版本为 2.8.0
  container_name: drone_server
  restart: always
  networks: 
    - drone  # 加入到drone网络
  ports:
    - '7929:80'
  environment:
    - DRONE_SERVER_PROTO=https                                                   # 访问协议，创建webHooks和重定向
    - DRONE_SERVER_HOST=drone.mwjz.live                                       # 主机名称，创建webHooks和重定向
  
```
<img src=./images/05/20.png width=50% />

<img src=./images/05/19.png width=50% />

<img src=./images/05/21.png width=50% />

### 无证书 HTTPS 触发 Webhook

在部署时碰到这样一种情况，当 `Drone` 是一个没有证书的 `HTTPS` 时，`Webhook` 推送也会出现 **X509** 错误。

<img src=./images/05/22.png width=50% />

<img src=./images/05/23.png width=50% />

解决这个问题需要设置 `Gitea` 的配置, 在 **/data/gitea/conf/app.ini** 配置文件中设置跳过验证

```conf
[webhook]
SKIP_TLS_VERIFY = true
```
<img src=./images/05/24.png width=50% />

也可以直接添加在 `Dockerfile` 中的 **environment** 属性

```yml
#gitea服务
  server:
    image: gitea/gitea:latest
    container_name: gitea_server
    restart: always
    environment:
      - GITEA__webhook__SKIP_TLS_VERIFY=true   # webhook 跳过 tls 验证
      - GITEA__webhook__DELIVER_TIMEOUT=10     # webhook 超时时间
```