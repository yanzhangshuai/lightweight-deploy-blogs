
对于个人来说，**私有NPM仓库** 作用性基本很小，但是对于企业，**私有NPM仓库** 可以保护代码暴露，具有很大的意义。

也是为了学习搭建 **私有NPM仓库**，就在持续部署中集成了私有仓库。


开源社区，有两个广泛使用的 **私有NPM仓库** 项目：

1. [Sinopia](https://github.com/rlidwka/sinopia)
2. [Verdaccio](https://github.com/verdaccio/verdaccio)

`Sinopia` 项目官方于2019年已经不再维护，也就是现在已经不在推荐使用此项目。

 `Verdaccio` 项目是从 `Sinopia`项目 **fork** 出来的，官方声称 100% 向后兼容 `Sinopia`。

`Verdaccio` 目前也就成了最普遍的 私有NPM仓库 的解决方案。 


# Verdaccio

## Verdaccio 概述

[`Verdaccio`](https://verdaccio.org/) 是一个 `Node` 创建的轻量的私有 **npm proxy registry**

 `Verdaccio` 中最强大的两个功能是 **上行链路** 和 **包身份权限**


## Verdaccio 部署

### Docker Compose 文件

`Verdaccio` 的 `Docker Compose` 文件比较简单，主要是配置数据挂载

```yml

version: '3.9'

services:
  verdaccio:
    image: verdaccio/verdaccio:5.5
    container_name: verdaccio
    restart: always
    ports:
      - '4873:4873'
    volumes:
      - /volumes/verdaccio/conf:/verdaccio/conf
      - /volumes/verdaccio/storage:/verdaccio/storage
      - /volumes/verdaccio/plugins:/verdaccio/plugins
```


### config.yaml

`Verdaccio` 项目提供了一个配置文件： **config.yaml**。

默认情况下 `Verdaccio` 会在首次运行时创建此文件。

但因为使用了 宿主目录 挂载数据，所以需要预先创建此文件。

 <img src=./images/07/01.png width=50% />

 ```yaml
# 包存储地址
storage: /verdaccio/storage

# 插件存储地址
plugins: /verdaccio/plugins

# UI相关信息
web:
  enable: true # 开启 Web 页面
  title: Verdaccio  # Web 页面标题

# 身份认证
auth:
  htpasswd:                           # 默认情况下使用的 htpasswd 插件作为身份认证
    file: /verdaccio/conf/htpasswd # htpasswd 文件为加密认证信息文件
    max_users: -1                     # 最大用户数量， -1 表示禁用新用户注册

# 上行链路
uplinks:
  npmjs:                                    # 上行名称，随便定义
    url: https://registry.npmjs.org/        # 上行地址
    timeout: 30s                            # 超时时间
 
                          
  taobao:                                   # 上行名称
    url: https://registry.npm.taobao.org/   # 上行地址
    timeout: 30s                          

# 包访问设置, 可以根据名称对包做不同权限设置
packages:
  '@*/*':
    access: $authenticated                # 登录用户才允许访问
    publish: $authenticated               # 登录用户才允许发布
    proxy: taobao                         # 代理上行链路地址

  '**':
    access: $authenticated                # 登录用户才允许访问
    publish: $authenticated               # 登录用户才允许发布
    proxy: taobao                         # 代理上行链路地址

server:
  keepAliveTimeout: 30                    # 服务器保持活动链接的时间,较大的包可能会消耗一定时间,此属性就是设置活动链接时间

middlewares:
  audit:
    enabled: true

# 日志
logs: { type: stdout, format: pretty, level: http  }

 ```

**config.yaml** 文件设置了一些关键属性， 至于其它属性，请参考： [verdaccio--配置文件](https://verdaccio.org/zh-CN/docs/configuration)


#### auth(身份认证)

**auth** 是设置 用户身份凭证的属性

`Verdaccio` 项目默认使用了 `htpasswd` 插件作为 **用户认证** 服务。


`htpasswd` 插件需要提供一个存储用户凭证的文件：**/verdaccio/conf/htpasswd**。


**max_users** 属性表示最大注册用户， 当值为 **-1** 时，表示禁止用户注册；当值不为 **-1**时，可以使用 **npm adduser** 命令添加用户。


禁用用户注册时，可以使用 [htpasswd-generator工具](https://hostingcanada.org/htpasswd-generator/) 生成身份凭证，然后存储在 **/verdaccio/conf/htpasswd**。

 <img src=./images/07/02.png width=50% />

 <img src=./images/07/03.png width=50% />


> PS：**用户认证** 可以自定义为其它插件

#### unlinks(上行链路)

**unlinks(上行链路)** 是设置上游代理仓库的属性。

**unlinks(上行链路)**  可以配置多个地址，针对每一个 **unlinks(上行链路)** 都可以做不同设置。

<img src=./images/07/04.png width=50% />

详细请参考 [verdaccio--上行链路](https://verdaccio.org/zh-CN/docs/uplinks)

默认的 **unlinks(上行链路)** 为 **npmjs**。


#### packages(访问权限)


**packages(访问权限)** 是设置包访问权限的属性。

可以根据名称对一个 或 一组 包分别对 访问、发布、代理等操作做不同的设置。

上述配置 简单的对所有包统一处理。

配置中访问、发布 权限设置为了 **$authenticated**， 这个值是 `Verdaccio` 预设的变量值，表示登录用户。

还可以将权限设置为 其它变量值 或 指定用户，详细请参考 [verdaccio--包的访问](https://verdaccio.org/zh-CN/docs/packages)


### 执行部署

配置文件准备就绪，就可以执行部署，部署成功后就可以访问页面

<img src=./images/07/05.png width=50% />

<img src=./images/07/06.png width=50% />

>PS: 注意开启云服务器 4873 端口号防火墙


### 挂载目录权限

默认情况下 `Verdaccio` 容器不具有宿主机目录的操作权限。


将容器目录挂载到宿主机后，`Verdaccio` 执行写入操作时，会返回权限错误。

解决这个问题，需要赋予 `Verdaccio` 容器 写入宿主机目录的权限。


> sudo chown -R 10001:65533 /volumes/verdaccio

<img src=./images/07/05_01.png width=50% />

### 测试Verdaccio仓库

部署成功后，可以在本地创建一个测试项目，发布到 `Verdaccio` 仓库中。


对于个人来说，**私有NPM仓库** 作用性基本很小，但是对于企业，**私有NPM仓库** 可以保护代码暴露，具有很大的意义。

也是为了学习搭建 **私有NPM仓库**，就在持续部署中集成了私有仓库。


开源社区，有两个广泛使用的 **私有NPM仓库** 项目：

1. [Sinopia](https://github.com/rlidwka/sinopia)
2. [Verdaccio](https://github.com/verdaccio/verdaccio)

`Sinopia` 项目官方于2019年已经不再维护，也就是最好不要再使用此项目进行搭建。

 `Verdaccio` 项目是从 `Sinopia`项目 **fork** 出来的，官方声称 100% 向后兼容 `Sinopia`。

`Verdaccio` 目前就成了普遍的 私有NPM仓库 的解决方案。 


# Verdaccio

## Verdaccio 概述

[`Verdaccio`](https://verdaccio.org/) 是一个 `Node` 创建的轻量的私有 **npm proxy registry**


`Verdaccio` 提供了上行链路功能， 安装 `Verdaccio` 仓库中不存在的包时，可以配置向上游仓库下载。

`Verdaccio` 还提供了强大的身份认证系统。

## Verdaccio 部署

### Docker Compose 文件

`Verdaccio` 的 `Docker Compose` 文件比较简单，主要配置数据挂载

```yml

version: '3.9'

services:
  verdaccio:
    image: verdaccio/verdaccio:5.5
    container_name: verdaccio
    restart: always
    ports:
      - '4873:4873'
    volumes:
      - /volumes/verdaccio/conf:/verdaccio/conf
      - /volumes/verdaccio/storage:/verdaccio/storage
      - /volumes/verdaccio/plugins:/verdaccio/plugins
```


### config.yaml

`Verdaccio` 项目提供了一个配置文件： **config.yaml**。

默认情况下 `Verdaccio` 会在首次运行时创建此文件。

但因为使用了 宿主目录 挂载数据，所以需要预先创建此文件。

 <img src=./images/07/01.png width=50% />

 ```yaml
# 包存储地址
storage: /verdaccio/storage

# 插件存储地址
plugins: /verdaccio/plugins

# UI相关信息
web:
  enable: true # 开启 Web 页面
  title: Verdaccio  # Web 页面标题

# 身份认证
auth:
  htpasswd:                           # 默认情况下使用的 htpasswd 插件作为身份认证
    file: /verdaccio/conf/htpasswd # htpasswd 文件为加密认证信息文件
    max_users: -1                     # 最大用户数量， -1 表示禁用新用户注册

# 上行链路
uplinks:
  npmjs:                                    # 上行名称，随便定义
    url: https://registry.npmjs.org/        # 上行地址
    timeout: 30s                            # 超时时间
 
                          
  taobao:                                   # 上行名称
    url: https://registry.npm.taobao.org/   # 上行地址
    timeout: 30s                          

# 包访问设置, 可以根据名称对包做不同权限设置
packages:
  '@*/*':
    access: $authenticated                # 登录用户才允许访问
    publish: $authenticated               # 登录用户才允许发布
    proxy: taobao                         # 代理上行链路地址

  '**':
    access: $authenticated                # 登录用户才允许访问
    publish: $authenticated               # 登录用户才允许发布
    proxy: taobao                         # 代理上行链路地址

server:
  keepAliveTimeout: 30                    # 服务器保持活动链接的时间,较大的包可能会消耗一定时间,此属性就是设置活动链接时间

middlewares:
  audit:
    enabled: true

# 日志
logs: { type: stdout, format: pretty, level: http  }

 ```

**config.yaml** 文件设置了一些关键属性， 至于其它属性，请参考： [verdaccio--配置文件](https://verdaccio.org/zh-CN/docs/configuration)


#### auth(身份认证)

**auth** 属性是 `Verdaccio` 用户身份凭证的属性

`Verdaccio` 项目默认使用了 `htpasswd` 插件作为 **用户认证** 服务。


`htpasswd` 插件需要提供一个存储用户凭证的文件：**/verdaccio/conf/htpasswd**。


**max_users** 属性表示最大注册用户， 当值为 **-1** 时，表示禁止用户注册；当值不为 **-1**时，可以使用 **npm adduser** 命令添加用户。


禁用用户注册时，可以使用 [htpasswd-generator工具](https://hostingcanada.org/htpasswd-generator/) 生成身份凭证，然后存储在 **/verdaccio/conf/htpasswd**。

 <img src=./images/07/02.png width=50% />

 <img src=./images/07/03.png width=50% />


> PS：**用户认证** 可以自定义为其它插件

#### unlinks(上行链路)

**unlinks(上行链路)** 属性是 `Verdaccio` 配置上游代理仓库的属性。

**unlinks(上行链路)**  可以配置多个地址，针对每一个 **unlinks(上行链路)** 都可以做不同设置。

<img src=./images/07/04.png width=50% />

详细请参考 [verdaccio--上行链路](https://verdaccio.org/zh-CN/docs/uplinks)

默认的 **unlinks(上行链路)** 为 **npmjs**。


#### packages(访问权限)


**packages(访问权限)** 属性是 `Verdaccio`  配置包访问权限的属性。

可以根据名称对一个 或 一组 包对 访问、发布、代理等不同操作做不同设置。

上述配置 只简单的 对所有进行了统一处理 中。

配置中访问、发布 权限设置为了 **$authenticated**， 这个值是 `Verdaccio` 预设的变量值，表示登录用户。

还可以将权限设置为 其它变量值 或 指定用户，详细请参考 [verdaccio--包的访问](https://verdaccio.org/zh-CN/docs/packages)


### 执行部署

配置文件准备就绪，就可以执行部署，随后访问页面

<img src=./images/07/05.png width=50% />

<img src=./images/07/06.png width=50% />

>PS: 注意开启云服务器 4873 端口号防火墙


### 挂载目录权限

默认情况下 `Verdaccio` 容器不具有宿主机目录的操作权限。


将容器容器目录挂载到宿主机后，`Verdaccio` 执行写入操作时，会返回权限错误。

解决这个问题，需要赋予 `Verdaccio` 容器 写入宿主机目录的权限。


> sudo chown -R 10001:65533 /volumes/verdaccio

<img src=./images/07/05_01.png width=50% />

### 测试Verdaccio仓库

部署成功后，可以在本地创建一个测试项目，发布到 `Verdaccio` 仓库中。

在没有任何问题的情况下，可以成功的将项目发布到 仓库 中，在页面登录时可以看到这个项目

<img src=./images/07/06_01.png width=50% />
<img src=./images/07/06_02.png width=50% />
<img src=./images/07/06_03.png width=50% />

<img src=./images/07/06_04.png width=50% />

<img src=./images/07/06_05.png width=50% />

### 网关配置

`Verdaccio` [官方文档--Reverse Proxy Setup](https://verdaccio.org/docs/reverse-proxy/) 中给出了使用反向代理的配置。

主要是对代理头的设置。其中至关重要的一个属性是：**proxy_set_header X-Forwarded-Proto $scheme**

```yml
server {
        #SSL 访问端口号为 443
        listen 443 ssl http2;
        #填写绑定证书的域名
        server_name npm.mwjz.live;
        #上传大小限制
        client_max_body_size 10M;
        #日志
        error_log /var/log/nginx/npm/error.log;
        access_log /var/log/nginx/npm/access.log;
        #证书文件
        ssl_certificate /etc/nginx/conf.d/ssl/npm/npm.mwjz.live_bundle.crt;
        #证书密钥文件
        ssl_certificate_key /etc/nginx/conf.d/ssl/npm/npm.mwjz.live.key;

        ssl_ciphers SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!3DES:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers on;
        location / {
            #   代理设置
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 600;
            proxy_redirect off;
            proxy_pass http://10.0.24.12:4873;
        }
        

        location ~ ^/verdaccio/(.*)$ {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_set_header X-NginX-Proxy true;
            proxy_redirect off;
            proxy_pass http://10.0.24.12:4873/$1;
        }
    }
```


<img src=./images/07/07.png width=50% />

<img src=./images/07/08.png width=50% />

重启 网关服务 和 `Verdaccio` 容器

> docker exec -it gateway nginx -s reload


# Drone 配置私有 NPM 仓库


`Drone` 持续部署中集成 `Verdaccio` 仓库，需要在执行时登录 仓库。

NPM 会将登录凭证存储在 **.npmrc** 文件中。

也就是需要一个插件执行登录操作，并将登录凭证写入 **.npmrc** 文件

<img src=./images/07/08.png width=50% />

`Drone` 社区中提供了一个这样的镜像插件：[robertstettner/drone-npm-auth](https://plugins.drone.io/robertstettner/drone-npm-auth/) 


```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: build              # 定义管道名称

volumes:                # 声明数据卷
- name: node_modules    # 数据卷名称
  host:                 # Host Volume
    path: /volumes/drone/volumes/web/node_modules   # 宿主机目录

clone:
  disable: false        # 启用代码拉取

steps:
  # 生成版本号标签
  - name: build-tags  
    image: yxs970707/drone-web-tags  # 使用镜像
    depends_on: [clone]   # 依赖的步骤，
    settings:
      tags:
        - latest

  # 私有 NPM 仓库登录     
  - name: npm-login 
    image: robertstettner/drone-npm-auth
    settings:
      registry: https://npm.mwjz.live/
      username:
        from_secret: npm_username
      password:
        from_secret: npm_password
      email:
        from_secret: npm_email
  
  # 编译项目
  - name: build-project   # 步骤名称
    image: node:16.13.2   # 使用镜像
    depends_on: [npm-login]   # 依赖的步骤，
    volumes:              # 挂载数据卷
    - name: node_modules  # 数据卷名称
      path: /drone/src/node_modules # 容器内目录
    commands:             # 执行命令
      - npm config set registry https://npm.mwjz.live/
      - npm config get
      - npm install       # 安装node_modules包
      - npm run build     # 执行编译

 # 打包Docker镜像
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

```


可以将`Drone` 中 `node_modules` 缓存清除，然后提交测试

<img src=./images/07/11.png width=50% />