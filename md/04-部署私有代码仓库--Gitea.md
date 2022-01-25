# 技术选型

企业级最流行的私有代码仓库是 `Gitlab`， 一开始我也打算部署 `Gitlab`作为私有代码仓库。

但部署完后发现， `Gitlab` 资源占用太大了。就算优化之后也要占用 **3g** 内存，最后只好放弃这一方案。

随后发现了 `Gitea`、`Gogs` 这两个轻量级的私有仓库，两个都是优秀的轻量级私有仓库。

后对它们进行了对比，发现 `Gitea` 是从 `Gogs` 项目 **fork** 出的项目。
官方给出了 **fork** 理由：https://blog.gitea.io/2016/12/welcome-to-gitea/，有兴趣的看看

也就是 `Gitea` 使用上是优于 `Gogs` 的，就选择了 `Gitea`


`Gitea` 虽然是轻量级，但也具有强大的功能，可以放心使用。

https://docs.gitea.io/zh-cn/


# Gitea

## 数据库选择
`Gitea` 支持`mysql` , `postgres`, `mssql`, `tidb` 、`sqlite3` 多种数据库。
最简单的是直接使用 `sqlite3`，作为一个文档性数据库，不需要单独部署服务。

而在此使用 `postgres` 数据库，现在 `postgres` 也是主流的数据库，在商业中，很多企业都从 `mysql` 转向了 `postgress`
至于 `postgress` 与 `mysql` 之间的对比，有兴趣的朋友可以自行查询


## DockerFile
```yml
version: '3.9'
# 创建自定义网络
networks:
  gitea:
    name: gitea
    driver: bridge

services:
  ## 数据库服务
  db:
    image: postgres:latest
    container_name: gitea_db
    restart: always
    networks: 
      - gitea  # 加入到gitea网络
    ports: 
      - 3003:5432
    environment:
      - POSTGRES_USER=gitea             # PGSQL默认用户
      - POSTGRES_PASSWORD=gitea         # PGSQL默认密码
      - POSTGRES_DB=gitea               # PGSQL默认数据库
    volumes:
      - /volumes/gitea/db:/var/lib/postgresql/data
  #gitea服务
  server:
    image: gitea/gitea:latest
    container_name: gitea_server
    restart: always
    networks:
      - gitea  # 加入到gitea网络
    ports:
      - '3000:3000'                       # HTTP服务端口
      - '3001:22'                         # SSH服务器端口
    environment:
      - USER_UID=1000                     # 运行容器使用的 UID  UID和GID是用于匿名数据卷挂载，
      - USER_GID=1000                     # 运行容器使用的 GID
      - APP_NAME=gitea                    
      - PROTOCOL=http                     # 服务使用的访问协议
      - HTTP_PORT=3000                    # HTTP 侦听端口 默认为3000
      - SSH_PORT=22                       # 克隆 URL 中显示的 SSH 端口
      - DOMAIN=82.157.55.94:3000          # UI显示的 HTTP克隆URL
      - LANDING_PAGE=explore
      - ROOT_URL=http://82.157.55.94:3000 # 服务器的对外 URL
      - DB_TYPE=postgres                  # 数据库类型
      - DB_HOST=db                        # 数据库连接地址, 使用network形式连接, serverName或者 containerName
      - DB_NAME=gitea                     # 数据库名称
      - DB_USER=gitea                     # 数据库连接用户
      - DB_PASSWD=gitea                   # 数据库连接密码

      - DISABLE_REGISTRATION=true         # 禁用用户注册，启用后只允许管理员添加用户
      - SHOW_REGISTRATION_BUTTON=false    # 是否显示注册按钮
      - REQUIRE_SIGNIN_VIEW=true          # 是否所有页面都必须登录后才可访问
      
    volumes:
      - /volumes/gitea/server/data:/data
      - /volumes/gitea/server/config:/etc/config
      - /volumes/gitea/server/timezone:/etc/timezone:ro
      - /volumes/gitea/server/localtime:/etc/localtime:ro
    depends_on:
      - db
```

以上是部署 `Gitea` 的 `Docker Compose` 文件。

在配置中部署了两个容器: 一个是 **`Postgres`(数据库)**服务，一个是 **`Gitea`**服务。

使用 **networks** 添加了一个自定义网络。 两个容器都加入这个自定义网络中，使用自定义网络进行通讯。

>PS: `Docker` 中， 提供了一个 `network` 模块。同属于一个 `network` 下的容器可以使用 **容器名称**、**服务名称** 直接通讯。

`Postgres` 服务中通过环境变量设置了默认的数据库、用户名称和用户密码信息。

`Gitea` 服务中通过环境变量设置了 运行容器的 `UID`、`GID`，HTTP监听端口、UI上显示的克隆URL。连接数据库、禁用注册等信息，至于还有其它参数，可以自行查询


`Gitea` 端口号映射了两个 **3000**、**3001**，分别是 `HTTP`访问和 `SSH` 访问，不过现在基本上都使用 `HTTP ， `SSH` 可以使用参数禁用


在配置文件中有一个 **depends_on** 属性，这个属性是控制部署顺序的。意思是 `Gitea` 部署依赖 `postgres` 部署 


使用这个配置安装完毕之后，会成功部署两个 `Docker` 容器和创建一个 `network`，成功后可以进行访问

 <img src=./images/04/01.png width=50% />
 <img src=./images/04/02.png width=50% />

## 安装引导

第一次访问会进入安装向导页面，该页面是用于设置安装配置信息的，

向导页面会带入 **environment** 中填写的设置，很多信息不需要进行设置。

<img src=./images/04/03.png width=50% />

不过其中有一个 **管理员账号设置**，

这个是设置管理员的。如果不设置管理员，默认第一个注册用户将自动成为管理员，

但是在禁止注册的情况下必须设置管理员

<img src=./images/04/04.png width=50% />
<img src=./images/04/05.png width=50% />

设置管理员后点击安装，便会使用当前页面配置进行安装 `gitea`。安装完毕后会自动跳转到主页

<img src=./images/04/06.png width=50% />

## 推送代码

成功之后可以创建一个仓库将之前的web项目推送到此仓库。

<img src=./images/04/07.png width=50% />

>PS 图中 `HTTP` 显示的 IP 地址是部署时 **DOMAIN** 属性设置的那个。

<img src=./images/04/08.png width=50% />


## 配置网关代理。
下一步就配置 `Gitea` 的网关代理。

首先还是配置网关，网关配置就不再介绍
```conf
server {
    #SSL 访问端口号为 443
    listen 443 ssl http2;
    #填写绑定证书的域名
    server_name gitea.mwjz.live;
    #日志
    error_log /var/log/nginx/gitea/error.log;
    access_log /var/log/nginx/gitea/access.log;
    #证书文件
    ssl_certificate /etc/nginx/conf.d/ssl/gitea/gitea.mwjz.live_bundle.crt;
    #证书密钥文件
    ssl_certificate_key /etc/nginx/conf.d/ssl/gitea/gitea.mwjz.live.key;

    ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        proxy_pass http://10.0.24.12:3000;
    }
}
```

配置完网关后，还需要配置 `Gitea` 服务中的配置，不然显示和跳转还是有问题

<img src=./images/04/09.png width=50% />


此时重新部署会很麻烦，可以修改配置 `Gitea` 的配置文件

配置文件是 **/data/gitea/conf/app.ini**。只需要修改此配置文件中 **ROOT_URL**、**DOMAIN**、 **SSH_DOMAIN**，然后重启容器就可以正确显示

<img src=./images/04/10.png width=50% />

<img src=./images/04/11.png width=50% />

<img src=./images/04/12.png width=50% />


作为一个强迫症，我还会将 `Portainer` 可视化工具中的环境变量进行改动。

`Portainer` 可视化工具是支持修改配置然后重启部署

<img src=./images/04/13.png width=50% />


>PS: 注意，直接改动 `Portainer` 可视化工具中环境变量是不行。环境变量所设置的配置已经写入了文件。