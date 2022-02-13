# Drone 管道机制

`Drone` 中引入了 `管道（Pipeline）` 机制。`管道（Pipeline）`相当于一个流程，`管道（Pipeline）`中可以执行多个 `步骤（step）`。

`步骤（step）` 就是使用 `插件（Plugin）` 配置的操作。

与 `Runner（执行器）` 相同的是，`管道（Pipeline）` 也支持多种类型，用于适配不同运行环境。当然某些类型可以使用容器化代替统一管理。

<img src=./images/05/25.png width=50% />

`Drone` 也是使用 `YAML` 语法作配置文件，在配置文件可以同时配置多个 `管道（Pipeline）` 。

默认情况下多个 `管道（Pipeline）` 是并行执行，这也是 `Drone` 的强大功能之一：**分布式管道系统**

```yml
kind: pipeline # 定义一个管道
type: docker # 定义管道的类型
name: test # 定义管道的名称
steps: # 定义管道的执行步骤
  - name: test # 步骤名称
    image: node:latest # 当前Docker步骤使用的镜像
    commands: # 当前步骤执行的命令
      - echo 测试drone执行2
```

在上一篇中配置的测试`管道（Pipeline）`。此`管道（Pipeline）`使用了 **docker** 类型。

`管道（Pipeline）` 中定义了一个`步骤（step）`， 使用了 `Node` 镜像。容器内执行了打印命令

整个自动化部署就是配置 `步骤（step）` 进行执行。

可以简单的理解为， **.drone.yml** 配置文件相当于一个 **.sh** 文件，部署操作配置在这个文件中，交给 `Drone` 引擎执行。

下面就一步步编写部署 `Web` 项目。

# 部署 Web 项目

## Build 阶段

上一篇中简单的介绍，可以将整个部署流程划分为两个阶段：

1. 拉取代码 ---> 编译项目 ---> 打包镜像 ---> 推送镜像仓库
2. 使用 SSH 连接服务器 ---> 拉取最新镜像 ---> 停止和移除旧容器 ---> 启动新容器。

可以以这样流程划分构建`管道（Pipeline）`。一个阶段为一个 `管道（Pipeline）`

第一阶段叫做 **build**

```yml
kind: pipeline # 定义一个管道
type: docker # 定义管道的类型
name: build # 定义管道的名称
```

### clone 代码

默认情况下，`管道（Pipeline）`执行的第一个`步骤（step）` 是 **拉取代码（clone）**。

这是 `Drone` 提供的一个默认 `步骤（step）`。

`.drone.yml` 文件可以使用 **clone** 属性对此`步骤（step）` 设置。

默认的 **clone** `步骤（step）`只支持设置 _disable_、和 _depth_。

如果需要使用到其它参数，可以将默认的 **clone** `步骤（step）`禁用，自定义拉取代码 `步骤（step）`

```yml
kind: pipeline # 定义一个管道
type: docker # 定义管道类型
name: build # 定义管道名称

clone:
  disable: false # 启用代码拉取
```

默认情况下， 拉取代码使用的是 `drone/git` 镜像。

部署 `Drone` 时可以使用 **environment** 属性替换默认镜像，可以参考[官方文档](https://docs.drone.io/runner/kubernetes/configuration/reference/drone-image-clone/)

<img src=./images/05/26.png width=50% />

<img src=./images/05/27.png width=50% />

### 编译代码

执行完毕 **clone** `步骤（step）` 后就可以进行代码编译了。

代码编译可以直接使用 `Node` 镜像执行 `package.json` 命令。

定义 **build-project** `步骤（step）`，执行代码编译。

在此 `步骤（step）` 中使用了 **depends_on** 属性，这个属性表示当前`步骤（step）`需要依赖指定步骤执行，也就是需要在指定步骤执行完毕后才开始执行此`步骤（step）`。

> PS: `步骤（step）` 之间是可以并发执行的。

```yml
kind: pipeline # 定义一个管道
type: docker # 定义管道类型
name: build # 定义管道名称

clone:
  disable: false # 启用代码拉取

steps:
  - name: build-project # 步骤名称
    image: node:16.13.2 # 使用镜像
    depends_on: [clone] # 依赖的步骤，
    commands: #执行命令
      - npm config set registry https://registry.npm.taobao.org # 切换淘宝镜像
      - npm install # 安装node_modules包
      - npm run build # 执行编译
```

<img src=./images/05/28.png width=50% />

<img src=./images/05/29.png width=50% />

> PS: 如果是服务器中没有 `node:16.13.2` 镜像，首先会拉取镜像，时间会更慢一些。

### 缓存 node_modules

如果多测试几次代码编译步骤，会发现一个问题：每次代码编译执行时间都比较长，在我服务器执行时间大约 1 分钟左右。

可以使用 `Gitea` 测试推送 `Webhook`，进行重复测试。

<img src=./images/05/30.png width=50% />

<img src=./images/05/31.png width=50% />

查询具体执行信息，会发现其中大部分时间都浪费在了 `npm install` 命令。

<img src=./images/05/32.png width=50% />

这是因为每一个步骤都是在一个进程内执行的，每一次执行都是一个新进程，

但是往往会有挂载数据这种情况，针对这种需求，`Drone` 也提供了 `Volume` 机制。允许将容器内文件挂载到宿主机中。

> PS： `Drone` 中代码目录在所有 `步骤（step）` 中共享，

`Drone` 中提供了两种 `Volume`

1. Host Volume：数据挂载到主机上，数据永久存在
2. Temporary Volume：数据挂载临时卷中用于`步骤（step）`间共享。`管道（Pipeline）` 执行完毕会清除数据卷

具体两者，可以参考[官方文档](https://docs.drone.io/pipeline/aws/syntax/volumes/)。

挂载数据卷分为两步

1. 声明数据卷
2. 使用数据卷

```yml
kind: pipeline # 定义一个管道
type: docker # 定义管道类型
name: test # 定义管道名称

volumes: # 声明数据卷
  - name: node_modules # 数据卷名称
    host: # Host Volume
      path: /volumes/drone/volumes/web/node_modules # 宿主机目录    #绝对路径

clone:
  disable: false # 启用代码拉取

steps:
  - name: build-project # 步骤名称
    image: node:16.13.2 # 使用镜像
    depends_on: [clone] # 依赖的步骤，
    volumes: # 挂载数据卷
      - name: node_modules # 数据卷名称
        path: /drone/src/node_modules # 容器内目录 绝对路径
    commands: # 执行命令
      - pwd # 查看当前目录
      - npm config set registry https://registry.npm.taobao.org # 切换淘宝镜像
      - npm install # 安装node_modules包
      - npm run build # 执行编译
```

注意：

1. 数据卷中**路径(path)**，必须为 **绝对路径**，不可以使用 **相对路径**。

   我使用 `pwd` 命令查询了当前目录为 **/drone/src**，

   也就是 `node_modules` 的目录为 **/drone/src/node_modules**

   <img src=./images/05/33.png width=50% />
   <img src=./images/05/34.png width=50% />

2. 使用数据卷必须开启 **Trusted** 权限。 **Trusted** 权限需要管理员用户设置

   <img src=./images/05/35.png width=50% />

第一次构建会在宿主机中挂载 `node_modules` 数据，之后再构建就可以省去了 `npm install` 执行时间，大大提高了构建速度

   <img src=./images/05/36.png width=50% />

   <img src=./images/05/37.png width=50% />

### 构建镜像

代码编译完毕后，下一个操作就是制作镜像并推送仓库了。

`Drone` 社区中提供了 `plugins/docker` 镜像插件用于构建镜像并将镜像直接推送到镜像仓库。

```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: build              # 定义管道名称

  - name: build-image     # 步骤名称
    image: plugins/docker # 使用镜像
    depends_on: [build-project] # 依赖步骤
    settings:             # 当前设置
      username: XXXXXX # 账号名称
      password: XXXXXX # 账号密码
      dockerfile: deploy/Dockerfile # Dockerfile地址， 注意是相对地址
      repo: yxs970707/deploy-web-demo # 镜像名称
      tags:             # 镜像标签
        - latest
        - 1.0.2
```

**settings** 属性是配置账号、密码、镜像名称等操作的属性,这是 `Drone` 提供的属性。 **settings** 属性会传给容器 **environment** 属性。

`plugins/docker` 其它 **settings** 可以查询[官方文档](https://plugins.drone.io/drone-plugins/drone-docker/)

在上述配置中使用了两个 `Tag`，加上了 `latest` 这个默认 `Tag`。

> PS: 注意，`Dockerfile` 地址使用了相对路径

> PS: `Docker Hub` 访问会很慢。

<img src=./images/05/38.png width=50% />
<img src=./images/05/39.png width=50% />

### Secret 配置账号密码

刚才构建镜像时在 `.drone.yml` 文件使用了明文账号密码，这样肯定是不允许的，可以使用 `Secret` 配置这样的敏感数据。

<img src=./images/05/40.png width=50% />

```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: build              # 定义管道名称

  - name: build-image     # 步骤名称
    image: plugins/docker # 使用镜像
    depends_on: [build-project] # 依赖步骤
    settings:             # 当前设置
      username:           # 账号名称
        from_secret: docker_username
      password:           # 账号密码
        from_secret: docker_password
      dockerfile: deploy/Dockerfile # Dockerfile地址， 注意是相对地址
      repo: yxs970707/deploy-web-demo # 镜像名称
      tags:             # 镜像标签
        - latest
        - 1.0.2
```

使用`Secret`时，需要使用 **from_secret** 属性设置。

### 根据 package.json 生成 Tags

打包镜像时设置的镜像版本号，是直接设置的固定数值，这样每次更新都要重新设置新版本号，也是一个繁琐的操作。

`Drone` 中可以使用变量设置， 并且内置了许多变量，例如： `DRONE_TAG`。但是个人感觉这些变量并不太好用。

我想要的效果是根据 `package.json` 文件 **version** 属性 设置镜像版本。这样管理起来比较方便。

后查询文档发现 `plugins/docker` 镜像支持读取项目根目录下 **.tags** 文件进行设置版本号

<img src=./images/05/41.png width=50% />

有一种解决方案，将`package.json` 文件 **version** 属性写入到 **.tags** 文件。

https://discourse.drone.io/t/using-custom-generated-tags-for-docker-images/1918/2

虽然感觉社区内会有这样功能的镜像插件，

但是查找起来浪费时间，于是自己写了一个简单的插件：https://github.com/yanzhangshuai/drone-web-tags

使用起来也很简单，并且同时支持设置其它 `Tags`。

```yml
steps:
  - name: build-project # 步骤名称
    image: node:16.13.2 # 使用镜像
    depends_on: [clone] # 依赖的步骤，
    volumes: # 挂载数据卷
      - name: node_modules # 数据卷名称
        path: /drone/src/node_modules # 容器内目录
    commands: # 执行命令
      - npm config set registry https://registry.npm.taobao.org # 切换淘宝镜像
      - npm install # 安装node_modules包
      - npm run build # 执行编译

  - name: build-tags
    image: yxs970707/drone-web-tags # 使用镜像
    depends_on: [clone] # 依赖的步骤，
    settings:
      tags:
        - latest # 设置其它tags, latest

  - name: build-image # 步骤名称
    image: plugins/docker # 使用镜像
    depends_on: [build-tags, build-project] # 依赖步骤
    settings: # 当前设置
      username: # 账号名称
        from_secret: docker_username
      password: # 账号密码
        from_secret: docker_password
      dockerfile: deploy/Dockerfile # Dockerfile地址， 注意是相对地址
      repo: yxs970707/deploy-web-demo # 镜像名称
```

<img src=./images/05/43.png width=50% />

<img src=./images/05/44.png width=50% />

<img src=./images/05/45.png width=50% />

## deploy 阶段

将镜像推送到镜像仓库后，持续部署的第二阶段就是在服务器更新部署。

第二阶段虽然细分了许多操作，但关键是远程连接服务器。所以为了简单直接将这些操作都配置到一个 `步骤（step）`

第二阶段 `管道（Pipeline）` 名字为 **deploy**

注意：`管道（Pipeline）` 之间需要使用 `---` 相隔开

<img src=./images/05/45_01.png width=50% />

**deploy** `管道（Pipeline）`需要在 **build** `管道（Pipeline）`执行完毕后才执行。

并且 **deploy** `管道（Pipeline）` 可以禁用代码拉取

```yml
kind: pipeline
type: docker
name: deploy

depends_on: # 依赖build管道
  - build

clone:
  disable: true # 禁用拉取
```

### SSH 连接并部署

之前说过，`Drone` 提供了多种 `Runner（执行器）` 和 `管道（Pipeline）` 类型， 但某些类型可以使用容器化统一化管理。

`Drone` 社区中提供了 `SSH` 连接镜像插件， [`appleboy/drone-ssh`](https://plugins.drone.io/appleboy/drone-ssh/)。

配置此步骤前,需要先改动 之前 **web** 项目的 `Docker Compose` 文件

- 配置中使用了具体 `Tag` 镜像。不过服务器部署时并不需要清楚当前是什么版本服务，直接部署 **最新版本(latest)** 就行。
- 取消对 **html** 目录的挂载。 **html** 数据并不推荐挂载到宿主机中，这样版本管理会非常混乱

<img src=./images/05/46.png width=50% />

```yml
kind: pipeline
type: docker
name: deploy

depends_on: # 依赖build管道
  - build

clone:
  disable: true # 禁用拉取、

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
      command_timeout: 2m
      script:
        - echo ====开始部署=======
        - docker pull yxs970707/deploy-web-demo:latest
        - docker-compose -p web down
        - docker volume rm web-nginx
        - docker-compose -f /yml/docker-compose/web.yml -p web up -d
        - docker rmi $(docker images | grep deploy-web-demo | grep none | awk  '{print $3}')
        - echo ====部署成功=======
```

服务器部署步骤一共 5 个命令

1. 拉取新镜像
2. 卸载旧容器
3. 删除 Volume
4. 启动新容器
5. 删除旧镜像

第三个命令可以在 `Docker Compose` 使用外部 `Volume` ，这样就不需要删除 `Volume` 了。

最后一个命令是删除旧的镜像，当成功拉取新的 **latest** 镜像，旧镜像 `Tag` 会变成 **none**，所以删除标签为 **none** 的镜像即可

<img src=./images/05/47.png width=50% />
<img src=./images/05/48.png width=50% />
<img src=./images/05/49.png width=50% />
