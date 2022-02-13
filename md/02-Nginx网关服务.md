这一篇中使用 `Nginx` 部署`网关中心`，用来代理服务器中服务。`网关中心`有优点也有缺点，也可以不采用`网关`系统。

> 部署 `Nginx网关` 系统需要使用域名，没有域名无法处理

# 网关概念

`网关(Gateway)` 是转发其它服务器通信数据的服务器，接收客户端发送来的请求时，它就像自己拥有资源的源服务器一样对请求进行
处理。有时候客户端可能都不会察觉，自己的通信目标是一个网关。

这是 `维基百科` 中对 `网关` 的描述。

`Nginx` 可以利用代理机制实现 `网关系统`

本篇中要做的是部署一个 `Nginx` 服务作为`网关`，此 `Nginx` 代理转发服务器中其它服务：例如 `Portainer`
服务器只暴露此 `Nginx网关`，`Nginx网关` 根据实际请求服务（根据域名区分）转发到对应服务。

这种 `Nginx网关` 系统访问具有一定的优点和缺点，

优点：

1.  可以对服务提供统一管理，例如给服务统一设置 `HTTPS` 、 压缩等功能
2.  对于拥有公网 IP 不足，但具有多台服务器的场景，可以提供一种解决公网 IP 不足的方案

缺点：

1.  因为网关服务作为所有服务入口，那么网关承载了所有访问压力。
2.  对网关服务依赖性较强，当网关一挂掉，那所有服务对于外网都处于都不可见状态。

> PS： 两个缺点可以对网关做负载均衡来解决。

`网关` 在系统基本上都随处可见，只是可能利用其它方案实现 `网关`。
例如后端微服务系统中便会提供一个网关，根据请求和服务器状态处理转发，

要根据业务场景来采用不同的解决方案。

在当前场景时，作为个人服务器，访问压力和服务器依赖性这问题都不需要考虑，而使用 `Nginx`网关则能更方便的提供 `HTTPS`和压缩等功能，并且可以使用子域名

# Nginx

## Nginx 概念

`Nginx` 是一个高性能的**网页服务器**，也是目前使用最广泛的网页服务器之一。`Nginx` 也可以用作**反向代理**和**负载均衡**，

本文中`网关` 便是使用的 `Nginx` 中 **反向代理** 功能

`Nginx` 是一个很强大的服务器，我对他也仅仅会简单使用，有兴趣的朋友可以深入学习:[Nginx 开发从入门到精通](http://tengine.taobao.org/book/index.html)

## Nginx 部署

### Docker Compose 配置

```yml
version: '3.9'
services:
  nginx:
    image: nginx:latest
    container_name: gateway
    restart: always
    ports:
      - 80:80 #启动端口
      - 443:443
    volumes: #数据卷映射地址
      - /volumes/gateway/conf.d:/etc/nginx/conf.d
      - /volumes/gateway/nginx.conf:/etc/nginx/nginx.conf
      - /volumes/gateway/logs:/var/log/nginx
```

作为**网关服务**，监听端口 **80（HTTP）** 和端口 **443（HTTPS）**。

配置中使用 `Volume` 对 `Nginx` **日志** 、 **conf.d** 和 **nginx.conf（配置文件）** 挂载到宿主机

> PS：`Nginx` 容器读取配置文件的目录地址为 **/etc/nginx/nginx.conf**

**nginx.conf** 为 _配置文件_， `Docker` 挂载文件时，宿主机中需要具有此文件，需要在服务器中先创建该文件。

<img src=./images/02/01.png width="50%" />

### Nginx 文件

**nginx.conf** 配置文件中监听 **80** 端口，

```conf
events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type text/html;
    sendfile on;
    keepalive_timeout 65;
    charset utf-8;
    server {
        listen 80;
        error_log  /var/log/nginx/portainer/error.log;
        access_log  /var/log/nginx/portainer/access.log;
        location / {
            proxy_pass http://10.0.24.12:9000;
        }
    }

}
```

这是一个简单的 **nginx.conf** 配置，监听 **80** 端口，用于以内网连接转发到 **9000** 端口(`Portainer`可视化客户端)。

也就是访问 **80** 端口会被转发到 `Portainer`可视化客户端

- events： 此模块用于处理 `Nginx` 连接的配置。 其中 **worker_connections** 属性表示最大并发数量
- http： 此模块用于处理 **HTTP** 监听。此模块中最重要是 **server** 属性，表示 `虚拟服务器（站点）`，在 `虚拟服务器` 中可以监听端口，代理其它服务器或者挂载静态文件。
  **serser 模块** 可以设置多个。
  - listen： 监听端口号
  - error_log、access_log：设置日志路径,
  * location：此属性用于匹配 _URL 请求_，在这里直接使用 **proxy_pass** 属性代理 **9000** 端口

> PS: 其它属性不熟悉的可以自行查询，都是些简单的配置属性

作为一个`网关`，后续要管理更多服务，为了方便查询日志，将每个应用日志分开存储，这也就是配置 **error_log**、**access_log** 的原因。

当然也可以不配置，在每一个应用中查看日志。

日志目录需要预先定义。`Dockerfile` 中 使用了 **/volumes/gateway/logs** 挂载了 **/var/log/nginx/**。

> sudo mkdir -p /volumes/gateway/logs/portainer

<img src=./images/02/01_01.png width="50%" />

可以使用 `Portainer` 进行部署，部署成功后如直接访问 **80** 端口会直接访问到 `Portainer`

<img src=./images/02/02.png width="50%" />

<img src=./images/02/03.png width="50%" />

<img src=./images/02/04.png width="50%" />

## Nginx 配置

### 压缩配置

`Nginx` 提供了强大的性能优化功能，最常见的就是压缩。

`Nginx` 中配置压缩也特别简单，只需要在 **nginx.conf** 文件中设置 **gzip** 相关属性即可

**gzip** 属性在 **http**、**server**、**location** 三个模块都可以设置。

由于此服务是`网关`，直接设置在 **http** 模块，为所有服务提供压缩功能。

```conf
http {
    include mime.types;
    default_type text/html;
    sendfile on;
    keepalive_timeout 65;
    charset utf-8;

    # 开启压缩
    # 压缩版本
    # 文件压缩类型
    gzip_types text/plain text/css application/javascript application/json application/xml;
    #设置压缩比率
    gzip_comp_level 5;
}
```

- gzip：是否开启 `ZIP` 压缩，该属性值可以设置为 **on** 或 **off**。

- gzip_type: 用于对匹配到的 `MIME` 类型文件进行压缩。其中 **text/html** 类型无论是否设置肯定会被压缩

- gzip_comp_level：设置 `GZIP` 压缩比，值的范围为：1-9，1：压缩比最小，处理最快；9：压缩比最大，处理最慢

在 **nginx.conf** 配置文件中添加 **gzip** 相关属性后，需要重新加载配置文件。

`Nginx` 中提供了重新加载配置文件命令 (**nginx -s reload**) ，此命令可以实现平滑更新，不重启服务的情况下进行更新。

> docker exec -it gateway nginx -s reload

重新加载之后可以分别访问 **80** 和 **9000** 端口，来测试文件大小和访问速度

- 9000

    <img src=./images/02/05.png width="50%" />

* 80

  <img src=./images/02/06.png width="50%" />

可以看到通过 `Nginx`网关代理压缩后的文件大小远远小于 **9000** 端口的，并且访问速度大大提高。这就是通过设置网关代理的好处之一

> PS：加载时注意要使用清空缓存并进行刷新

> PS：使用`网关`后，可以将 服务器 **9000** 防火墙关闭，只使用`网关`访问

### server_name

在刚才使用了 `Nginx`网关监听 **80** 代理了 **9000** 端口。那么怎么代理多个应用呢？

**server** 属性作为一个 `虚拟主机` 概念，可以使用多个 **server** 代理多个应用。

使用多个 **server**，需要一个前置条件，那么判断具体请求的应用?

解决这个问题就需要使用到 `Nginx` 中 **server_name** 属性和 **域名**

**server** 属性中有一个 **server_name** 属性，这个属性值会匹配请求中的 **host** 属性。
当请求中的 **host** 属性匹配 **service_name** 属性值，就执行此 **server** 。

通过 **server_name** 和不同的域名，可以决定请求的真正服务。

域名需要备案，需要时间，不过也很简单。域名本身也不贵。我具有一个已经备过案的域名： **mwjz.live** 。

主域名都会部署主站，像 `Portainer` 这些服务则使用子域名。子域名不需要付费，在云应用厂商中直接配置解析规则即可。

我的域名同样在 腾讯云 购买的，在腾讯云已购买域名中配置子域名解析规则即可

<img src=./images/02/07.png width="50%" />

在此配置了一个 _portainer_ 子域名用来访问 `Portainer` 服务。 完整的子域名是 **portainer.mwjz.live**

> PS：当配置完域名解析，会有一段时间的延迟

在 **nginx.conf** 可以将 **portainer.mwjz.live** 配置于 **server_name**

```conf
server {
    listen 80;
    #填写绑定证书的域名
    server_name portainer.mwjz.live;
    #日志
    error_log  /var/log/nginx/portainer/error.log;
    access_log  /var/log/nginx/portainer/access.log;
    location / {
        proxy_pass http://10.0.24.12:9000;
    }
}

```

配置并重新加载`网关(Nginx)` 服务后，就可以使用域名访问

> docker exec -it gateway nginx -s reload

<img src=./images/02/08.png width="50%" />

可以看到访问 **portainer.mwjz.live** 就可以访问到 `Portainer` 客户端。

同理当配置多个 **server** 管理时，只需要配置不同的 **server_name**。

### HTTPS 和 HTTP2

#### HTTPS 证书

当今时代 网站基本上都已经使用 `HTTPS` 了。

`HTTPS` 需要申请证书，可以购买付费的，也可以申请免费的，甚至可以自己创建证书。

腾讯云服务器中有第三方提供了一年的免费证书。只需要申请就可以使用

<img src=./images/02/09.png width="50%" />

申请成功后下载 `Nginx` 版本然后将证书后上传服务器使用。

<img src=./images/02/10.png width="50%" />

将证书上传到了 **/volumes/gateway/conf.d/ssl/portainer/** 目录。

<img src=./images/02/11.png width="50%" />

因为配置 `Nginx` 网关时，将 **/etc/nginx/conf.d** 挂载到宿主机 **/volumes/gatewal/conf.d** 目录，

所以也相当于将证书存放在 `Nginx`容器中 **/etc/nginx/conf.d/ssl/portainer/** 目录。

#### Nginx 配置 HTTPS

```conf
server {
    #SSL 访问端口号为 443
    listen 443 ssl;
    #填写绑定证书的域名
    server_name portainer.mwjz.live;
    #日志
    error_log  /var/log/nginx/portainer/error.log;
    access_log  /var/log/nginx/portainer/access.log;
    #证书文件
    ssl_certificate /etc/nginx/conf.d/ssl/portainer/portainer.mwjz.live_bundle.crt;
    #证书密钥文件
    ssl_certificate_key /etc/nginx/conf.d/ssl/portainer/portainer.mwjz.live.key;

    ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        proxy_pass http://10.0.24.12:9000;
    }
}
server {
    listen 80;
    #填写绑定证书的域名
    server_name portainer.mwjz.live;
    #日志
    error_log  /var/log/nginx/portainer/error.log;
    access_log  /var/log/nginx/portainer/access.log;
    location / {
        proxy_pass http://10.0.24.12:9000;
    }
}

```

`HTTPS` 端口为 **443**

监听端口后加上 **SSL** 表示开启 `HTTPS`

> 开启 **SSL**，必须提供证书文件

- ssl_certificate: 提供给虚拟服务器的 `PEM` 格式证书

* ssl_certificate_key: 提供给虚拟服务器的 `PEM` 格式证书的的密钥
* ssl_ciphers: 首选加密套件
* ssl_protocols: 允许的加密协议
* ssl_prefer_server_ciphers: 指定在使用 SSLv3 和 TLS 协议时，服务器密码应优先于客户端密码。

更新配置文件后进行重新加载，便可以使用 `HTTPS` 协议访问

> docker exec -it gateway nginx -s reload

<img src=./images/02/12.png width="50%" />

#### HTTP 跳转 HTTPS

现在各大网站使用 `HTTPS` 协议后，使用 `HTTP` 访问时会返回 **307** 响应，然后切换为 `HTTPS` 协议访问。

<img src=./images/02/13.png width="50%" />

这是使用 `HTTP` 协议访问 `Github`，可以看到返回了一个 **307**，随后就跳转 `HTTPS` 协议了。

这个操作其实很简单，只需要将 **80** 端口返回 **307** 和对应的地址。

```conf

server {
    #SSL 访问端口号为 443
    listen 443 ssl;
    #填写绑定证书的域名
    server_name portainer.mwjz.live;
    #日志
    error_log  /var/log/nginx/portainer/error.log;
    access_log  /var/log/nginx/portainer/access.log;
    #证书文件
    ssl_certificate /etc/nginx/conf.d/ssl/portainer/portainer.mwjz.live_bundle.crt;
    #证书密钥文件
    ssl_certificate_key /etc/nginx/conf.d/ssl/portainer/portainer.mwjz.live.key;

    ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        proxy_pass http://10.0.24.12:9000;
    }
}
server {
    listen 80;
    return 307 https://$host$request_uri;
}
```

在 **80** 端口的 `虚拟主机` 中返回 **307** 状态码和 `HTTPS` 协议的请求。
此时将所有的 **80** 请求转成 **443**，在之后添加其它应用时只需要设置 **443** 端口即可

> $host： 请求的 host 地址。$request_uri：请求的路由地址

此时使用 `HTTP` 协议请求 `Portainer` 便也会返回 **307**，随后使用 `HTTPS` 协议重新请求。

<img src=./images/02/14.png width="50%" />

#### HTTP2

`Nginx` 配置 `HTTP2` 很简单，只需要在 监听端口号后添加 **http2** 标识

```conf
server {
    #SSL 访问端口号为 443
    listen 443 ssl http2;
    #填写绑定证书的域名
    server_name portainer.mwjz.live;
    #日志
    error_log  /var/log/nginx/portainer/error.log;
    access_log  /var/log/nginx/portainer/access.log;
    #证书文件
    ssl_certificate /etc/nginx/conf.d/ssl/portainer/portainer.mwjz.live_bundle.crt;
    #证书密钥文件
    ssl_certificate_key /etc/nginx/conf.d/ssl/portainer/portainer.mwjz.live.key;

    ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        proxy_pass http://10.0.24.12:9000;
    }
}
```

重新加载配置文件后再访问 `Portainer` 便可以看到相应为 `HTTP2`

> docker exec -it gateway nginx -s reload

<img src=./images/02/15.png width="50%" />

> PS：如果没有 **协议** 选项，使用右键打开

<img src=./images/02/16.png width="50%" />
