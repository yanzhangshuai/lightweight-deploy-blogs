# 配置接口代理

前后端分离情况下，前端请求后端接口最常用的一种方式就是使用反向代理，反向代理会让浏览器认为是同源路径，也就实现了跨域操作。

目前流行的前端打包器，`webpack`、`vite` 在开发模式，都具有反向代理的配置。

`Nginx` 服务器，反向代理也是最重要的功能之一，之前的 `网关`实现方式就是使用了反向代理。此篇中主要是配置接口代理 和 通过镜像参数 配置 `Nginx` 接口代理

## Dev 测试

当前使用的 web 模板项目中对于开发环境的 API 代理和访问接口请求都已经设置好了。只需要设置一下配置地址。

接口是在网上找的一个，接口地址为： http://jsonplaceholder.typicode.com/posts/1

1.  **.env.development** 文件中配置代理域名地址

    <img src=./images/03/25.png width=50% />

2.  使用 **Http** 模块请求

    <img src=./images/03/26.png width=50% />

配置完毕后使用 `npm run dev` 运行便可以看到请求结果。

<img src=./images/03/27.png width=50% />

## Nginx 代理接口

`Nginx` 中使用代理也极为简单，只需要配置 **location**

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
    error_log /var/log/nginx/error.log;
    access_log /var/log/nginx/access.log;
    server {
        listen 80;

        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        location ~* /api/(.*) {
            resolver 8.8.8.8;
            proxy_set_header Host $proxy_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-NginX-Proxy true;
            proxy_pass http://jsonplaceholder.typicode.com/$1$is_args$args;
        }
    }
}

```

第二个 **location** 就是配置 API 接口代理。

**location** 配置了监听路由以 **/api** 开头的请求路由。将 **/api** 开头的请求路由转发到 **proxy_pass** 属性值

监听路由使用了正则匹配， **proxy_pass** 属性值中的 **$1** 是 **location** 监听路由中 **(.\*)** 的匹配项。

注意：

1.  使用域名做反向代理地址时，需要添加 **resolver** 解析。 https://developer.aliyun.com/article/486252
2.  使用域名访问时，需要改变 **Host** 请求头，否则会报 **403**。https://blog.csdn.net/liyyzz33/article/details/95340765

添加成功后可以重新打包镜像然后本地部署测试。正常的情况下就如下图可以正常访问。

镜像版本改为 **1.0.1**

<img src=./images/03/28.png width=50% />

<img src=./images/03/29.png width=50% />

## 代理地址参数化

接下来完成一个操作：将 API 代理地址变为启动容器参数化配置。

参数化可以将 API 代理地址作为一个变量的形式脱离于镜像。具有更好的扩展性。

### 代理地址参数化思路

代理地址参数化这个操作可以分为两个步骤思考

#### 使用 `Nginx` 变量

第一步是将 `Nginx` 中 **proxy_pass** 属性值变量化，`Nginx` 配置中是支持变量的，变量定义是以 **$** 开头的。

`Nginx` 自身有许多变量提供，例如 **$host**。 `Nginx` 还支持自定义变量。 可以使用 **set** 定义变量，使用变量可以设置属性值。

**proxy_pass** 属性值可以使用一个变量设置 **$SERVER_URL**。

```conf
    location ~* /api/(.*) {
            resolver 8.8.8.8;
            proxy_set_header Host $proxy_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-NginX-Proxy true;
            proxy_pass $SERVER_URL/$1$is_args$args;
        }
```

**$SERVER_URL** 这个变量怎么定义呢？

`Nginx` 支持在配置文件中定义变量，也支持在一个文件中定义变量，**nginx.conf** 中使用 **include** 引入定义变量的文件。

配置文件中可以引用一个文件（**/etc/nginx/conf.d/\*.variable**），然后将变量定义在这个文件。

```conf
    server {
        listen 80;
        include /etc/nginx/conf.d/*.variable;

        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        location ~* /api/(.*) {
            resolver 8.8.8.8;
            proxy_set_header Host $proxy_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-NginX-Proxy true;
            proxy_pass $SERVER_URL/$1$is_args$args;
        }
    }
```

#### 定义 Nginx 变量

第二步是定义创建 **/etc/nginx/conf.d/\*.variable** 文件逻辑
这个逻辑需要在 `Dockerfile` 定义。可以直接写在 `Dockerfile` 中。

在此我定义了一个 **.sh** 文件， `Dockerfile` 中定义执行 **.sh** 文件。

```sh
#/bin/bash

# 设置多个环境变量到 environment variable
# echo -e "set \$variable1 $PATH;
# set \$variable2 $PATH;
# set \$variable3 $PATH;" >

# 设置单个环境变量到 environment variable
echo set \$SERVER_URL $SERVER_URL\; > /etc/nginx/conf.d/server.variable
```

<img src=./images/03/30.png width=50% />

**deploy** 目录中创建一个 **variable.sh** 文件，此文件中写入 **创建变量文件**

`echo` 命令将设置变量写入到 **/etc/nginx/conf.d/server.variable** 文件中。

第一个 **$SERVER_URL** 是 `Nginx` 变量名称，第二个 **$SERVER_URL** 是 `Nginx` 变量值，而这个变量值又是一个变量，这个变量由 `Docker` 提供。

此 **.sh** 执行配置写在 `Dockerfile`

```dockerfile
FROM nginx:latest

COPY ./dist /usr/share/nginx/html

COPY ./deploy/nginx.conf /etc/nginx

# 创建存放sh文件目录
RUN mkdir /etc/nginx/sh

# 将 sh 文件 copy 到 镜像文件内
COPY ./deploy/variable.sh /etc/nginx/sh


# 设置环境变量初始值
ENV SERVER_URL=http://jsonplaceholder.typicode.com

# 设置variable.sh 执行权限
RUN chmod a+x /etc/nginx/sh/variable.sh

# 执行sh文件
RUN ["sh", "/etc/nginx/sh/variable.sh"]

# 容器应用端口
EXPOSE 80
```

在 `Dockerfile` 文件中新增了

1. 创建了存放 **sh** 目录。
2. 将 **varibale.sh** 文件拷贝到镜像内
3. 使用 **ENV** 命令提供一个环境变量的默认值
4. 设置 **sh** 执行权限
5. **RUN** 命令执行 **sh** 文件

新增的命令是将 **sh** 文件写入到镜像中，进行执行。并设置了环境变量初始值。

### 代理地址参数化部署

#### 测试部署

此时可以构建镜像进行本地测试，在此直接贴出测试结果。

<img src=./images/03/31.png width=50% />

进入容器内部查看 **/etc/nginx/conf.d/server.variable** 文件已经成功写入。

<img src=./images/03/32.png width=50% />

启动容器时没有设置 **-e** 属性，默认使用的是镜像内部默认值。可以启动容器时指定环境变量。有兴趣朋友可以将默认值改为其它值就行测试。

> docker run --name web -p 7777:80 -itd -e SERVER_URL=http://jsonplaceholder.typicode.com yxs970707/deploy-web-demo:1.0.1

#### 服务器部署

测试成功后，将镜像推送到 `Docker Hub`, 进行重新部署

注意：重新部署前注意要清除原容器和 Volume,以保持整洁

<img src=./images/03/33.png width=50% />

```yml
version: '3.9'

volumes:
  web-html:
    name: web-html
    driver: local
    driver_opts:
      o: bind
      type: none
      device: /volumes/web/html
  web-nginx:
    name: web-nginx
    driver: local
    driver_opts:
      o: bind
      type: none
      device: /volumes/web/nginx

services:
  nginx:
    image: yxs970707/deploy-web-demo:1.0.1
    container_name: web
    restart: always
    ports:
      - 7777:80
    volumes:
      - web-html:/usr/share/nginx/html
      - web-nginx:/etc/nginx
    environment:
      SERVER_URL: http://jsonplaceholder.typicode.com
```

以上是新的 **YMAL** 配置文件，
配置文件中添加了一个新增了一个新的 **Volume**，用于将容器内 **/etc/ninx** 目录文件暴露。

启动时配置了 **SERVER_URL** 环境变量。

> PS： 需要创建 **/volumes/web/nginx** 和 **/volumes/web/html** 目录

使用此文件进行启动，启动成功后进行访问。

<img src=./images/03/34.png width=50% />

因为使用了 **Volume** 挂载了 **/etc/nginx**，可以在宿主机目录查看 **.sh** 和 **.variable** 文件

<img src=./images/03/35.png width=50% />

# 设置网关

部署完 web 项目后，接下来设置这个服务的`网关`。

当前服务要部署到主域名。

第一步

申请并上传服务器 **SSL** 证书，并且创建 **/volumes/gateway/logs/web** 目录

<img src=./images/03/36.png width=50% />

第二步

`网关（Nginx）` 文件中配置 **web** 项目，代理到 **7777** 端口。

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

    # 开启压缩
    gzip on;
    # 文件压缩类型
    gzip_types text/plain text/css application/javascript application/json application/xml;
    #设置压缩比率
    gzip_comp_level 5;

    server {
        #SSL 访问端口号为 443
        listen 443 ssl http2;
        #填写绑定证书的域名
        server_name mwjz.live;
        #日志
        error_log /var/log/nginx/web/error.log;
        access_log /var/log/nginx/web/access.log;
        #证书文件
        ssl_certificate /etc/nginx/conf.d/ssl/mwjz/mwjz.live_bundle.crt;
        #证书密钥文件
        ssl_certificate_key /etc/nginx/conf.d/ssl/mwjz/mwjz.live.key;

        ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers on;
        location / {
            proxy_pass http://10.0.24.12:7777;
        }
    }

    server {
        #SSL 访问端口号为 443
        listen 443 ssl http2;
        #填写绑定证书的域名
        server_name portainer.mwjz.live;
        #日志
        error_log /var/log/nginx/portainer/error.log;
        access_log /var/log/nginx/portainer/access.log;
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
}

```

第三步

上传配置文件并且重新加载配置文件

> docker exec -it gateway nginx -s reload

重新加载 `网关(Nginx)` 配置后可以使用域名访问。

<img src=./images/03/37.png width=50% />
