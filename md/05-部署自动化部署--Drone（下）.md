# Drone 管道机制

`Drone` 中引入了 `管道（Pipeline）` 的概念。`管道（Pipeline）`相当于一个流程，`管道（Pipeline）`中可以执行多个 `步骤（step）`。

`步骤（step）` 就是配置的一个个操作。

与  `Runner` 相同的是， `Drone` 也支持多种类型的 `管道（Pipeline）`。用于适配不同运行环境。有些可以使用 容器化 类型替代

类型 **ssh** 类型的`管道（Pipeline）`可以使用 **docker** 类型中 `SSH` 镜像处理。这要做管理起来统一化

<img src=./images/05/25.png width=50% />



`Drone` 使用了 `YAML` 作为配置文件。并且配置文件可以同时配置多个 `管道（Pipeline）` 。 

默认情况下多个 `管道（Pipeline）` 是并行的，这也是 `Drone` 的强大功能之一：**分布式管道系统**


```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道的类型
name: test              # 定义管道的名称
steps:                  # 定义管道的执行步骤
  - name: test          # 步骤名称
    image: node:latest  # 当前Docker步骤使用的镜像
    commands:           # 当前步骤执行的命令
      - echo 测试drone执行2
```

着是上一篇中配置的测试`管道（Pipeline）`。此`管道（Pipeline）`使用了 **docker** 类型。

`管道（Pipeline）` 中定义了一个`步骤（step）`， 使用了 `Node` 镜像。

整个自动化部署就是使用镜像构建执行 `步骤（step）`。

可以这样理解， **.drone.yml** 配置文件为一个 **.sh** 文件，所有打包部署的操作都配置在这个文件中，交给 `Drone` 引擎执行。

下面就一步步编写部署 `Web` 项目。


# 部署 Web 项目

## Build 阶段
上一篇中简单的介绍过，可以将整个部署流程划分为两个阶段：

1. 监听代码仓库提交 ---> 拉取最新代码 ---> 进行项目打包 ---> 镜像打包 ---> 推送到 镜像仓库
2. 使用SSH连接服务器 ---> 拉取最新镜像 ---> 停止移除旧容器 ---> 启动新容器。

可以以这样流程划分构建`管道（Pipeline）`。一个阶段构建为一个 `管道（Pipeline）`

第一阶段叫做 **build**

```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道的类型
name: build              # 定义管道的名称
```

### clone 代码

默认情况下，`管道（Pipeline）`执行的第一个`步骤（step）` 是 **拉取代码（clone）**。

这是 `Drone` 提供的一个默认 `步骤（step）`。


`.drone.yml` 文件 **clone** 属性可以对此`步骤（step）`进行设置。

默认的 **clone** `步骤（step）`只支持设置 *disable*、和 *depth*。

如果需要使用到其它参数，可以将默认的 **clone** `步骤（step）`禁用，使用自定义`步骤（step）`

```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: build             # 定义管道名称

clone:
  disable: false        # 启用代码拉取

```

默认情况下， 拉取代码使用的是 **drone/git** 镜像。

在部署 `Drone` 时可以使用 **environment** 中配置其他镜像代替 **drone/git**，可以参考[官方文档](https://docs.drone.io/runner/kubernetes/configuration/reference/drone-image-clone/)

<img src=./images/05/26.png width=50% />

<img src=./images/05/27.png width=50% />

### 编译代码

执行完 **clone** `步骤（step）` 后就可以进行代码编译了。

代码编译可以直接使用 `Node` 镜像执行 `package.json` 命令。

`.drone.yml` 文件中定义 **build-project** `步骤（step）`，执行代码编译。

在此 `步骤（step）` 中使用 **depends_on** 属性，
这个属性表示当前`步骤（step）`需要依赖指定步骤执行，也就是需要在指定步骤执行完后才开始执行此步骤。


>PS: `步骤（step）` 之间是可以并发执行的。


```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: build             # 定义管道名称

clone:
  disable: false        # 启用代码拉取

steps:
  - name: build-project # 步骤名称
    image: node:16.13.2 # 使用镜像
    depends_on: [clone] # 依赖的步骤，
    commands:   #执行命令
      - npm config set registry https://registry.npm.taobao.org     # 切换淘宝镜像
      - npm install     # 安装node_modules包
      - npm run build   # 执行编译

```

<img src=./images/05/28.png width=50% />

<img src=./images/05/29.png width=50% />


>PS: 如果是服务器中没有 `node:16.13.2` 镜像，首先会拉取镜像，时间会更慢一些。

### 缓存node_modules

如果测试几次代码编译步骤，会发现一个问题：每次代码编译执行时间都很长，在我服务器执行时间大约1分钟左右。

可以使用 `Gitea` 测试推送 `Webhook`，进行重复测试。

<img src=./images/05/30.png width=50% />

<img src=./images/05/31.png width=50% />


如果查询具体执行信息，会发现其中大部分时间都浪费在了 `npm install` 命令。

<img src=./images/05/32.png width=50% />


这是因为每一个步骤都是在一个进程内执行的，每一次执行都是一个新进程，


但是往往会有挂载数据这种清空。例如 `Docker` 中的 `Volume`。

不过 `Drone` 提供了拉取代码目录在所有 `步骤（step）` 中共享，


针对这种需求，`Drone` 也提供了 `Volume` 机制。允许将容器内文件挂载到宿主机中。

`Drone` 中提供了两种 `Volume`

1. Host Volume 挂载到主机上，数据永久存在
2. Temporary Volume 挂载临时卷中用于`步骤（step）`间共享。`管道（Pipeline）` 执行完毕会清除数据卷

具体两者，可以参考[官方文档](https://docs.drone.io/pipeline/aws/syntax/volumes/)。

挂载数据卷分为两步
1. 声明数据卷
2. 使用数据卷

```yml
kind: pipeline          # 定义一个管道
type: docker            # 定义管道类型
name: test              # 定义管道名称


volumes:                # 声明数据卷
- name: node_modules    # 数据卷名称
  host:                 # Host Volume
    path: /volumes/drone/volumes/web/node_modules   # 宿主机目录    #绝对路径

clone:
  disable: false        # 启用代码拉取

steps:
  - name: build-project   # 步骤名称
    image: node:16.13.2   # 使用镜像
    depends_on: [clone]   # 依赖的步骤，
    volumes:              # 挂载数据卷
    - name: node_modules  # 数据卷名称
      path: /drone/src/node_modules # 容器内目录 绝对路径
    commands:             # 执行命令
      - pwd               # 查看当前目录
      - npm config set registry https://registry.npm.taobao.org     # 切换淘宝镜像
      - npm install       # 安装node_modules包
      - npm run build     # 执行编译
```



注意：
1. 数据卷中**路径(path)**，必须为 **绝对路径**，不可使用 **相对路径**。
   
   我使用 `pwd` 命令查询了容器内当前目录为 **/drone/src**，
   
   也就是 `node_modules` 的目录为 **/drone/src/node_modules**

   <img src=./images/05/33.png width=50% />
   <img src=./images/05/34.png width=50% />

2. 使用数据卷必须开启 **Trusted** 权限。 **Trusted** 权限需要管理员用户设置
   
   <img src=./images/05/35.png width=50% />

第一次构建会在宿主机中挂载 `node_modules` 数据，之后再构建就可以省去了 `npm install` 执行时间，大大提高执行速度

   <img src=./images/05/36.png width=50% />

   <img src=./images/05/37.png width=50% />



### 构建镜像
代码编译完毕后，下一个操作就是制作镜像并推送仓库了。

`Drone` 官方提供了一个 **plugins/docker** `插件(plugin)` 可以用于构建镜像 并 直接推送到镜像仓库。

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

`settings` 属性是配置账号、密码、镜像名称等操作的属性。

这是 `Drone` 提供的属性。 **settings** 属性会传给容器中的 **environment** 属性。


**plugins/docker** 其它 **settings** 可以查询[官方文档](https://plugins.drone.io/drone-plugins/drone-docker/)


在上述配置中使用了两个 `tag`, 加上了 `latest` 这个默认 `tag`。


>PS: 注意，`Dockerfile` 地址使用了相对路径 
>PS: `Docker Hub` 访问会很慢。


<img src=./images/05/38.png width=50% />
<img src=./images/05/39.png width=50% />

### Secret 配置账号密码

刚才构建镜像时在 `.drone.yml` 文件中明文账号密码，这种情况在真实场景中肯定是不允许的。

`Drone` 提供了 `Secret` 配置敏感数据。 

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

使用`Secret`时，需要 **from_secret** 属性设置。


### 根据 package.json 生成 Tags

刚才设置镜像版本号，是直接设置固定数值，但这样需要每次更新都要重新设置，一个繁琐的操作。


`Drone` 提供了可以使用变量进行设置， 并且内置了许多变量，例如： `DRONE_TAG`。但是个人感觉这些变量并不太好用。


我想要的效果是根据 `package.json` 文件 **version** 属性 设置镜像版本。这样管理起来比较方便。

后查询文档发现 `plugins/docker` 镜像支持读取 **.tags** 文件设置版本号

<img src=./images/05/41.png width=50% />


有一种解决方案，将`package.json` 文件 **version** 属性写入到 **.tags** 文件。

https://discourse.drone.io/t/using-custom-generated-tags-for-docker-images/1918/2


虽然感觉社区内有这样的功能的插件，

但是查找起来浪费时间，于是自己写了一个简单的插件：https://github.com/yanzhangshuai/drone-web-tags

使用起来也很简单，并且同时支持设置其它 `Tags`。

```yml
steps: 
  - name: build-project   # 步骤名称
    image: node:16.13.2   # 使用镜像
    depends_on: [clone]   # 依赖的步骤，
    volumes:              # 挂载数据卷
    - name: node_modules  # 数据卷名称
      path: /drone/src/node_modules # 容器内目录
    commands:             # 执行命令
      - npm config set registry https://registry.npm.taobao.org     # 切换淘宝镜像
      - npm install       # 安装node_modules包
      - npm run build     # 执行编译

  - name: build-tags
    image: yxs970707/drone-web-tags  # 使用镜像
    depends_on: [clone]              # 依赖的步骤，
    settings:
      tags:
        - latest                     # 设置其它tags, latest

  - name: build-image     # 步骤名称
    image: plugins/docker # 使用镜像
    depends_on: [build-tags, build-project] # 依赖步骤
    settings:             # 当前设置
      username:           # 账号名称
        from_secret: docker_username
      password:           # 账号密码
        from_secret: docker_password
      dockerfile: deploy/Dockerfile # Dockerfile地址， 注意是相对地址
      repo: yxs970707/deploy-web-demo # 镜像名称
```

<img src=./images/05/43.png width=50% />

<img src=./images/05/44.png width=50% />

<img src=./images/05/45.png width=50% />


## deploy 阶段

将镜像推送到镜像仓库之后，自动化部署的第二阶段就是在服务器更新。
第二阶段虽然细分了许多操作，但是关键是远程连接服务器。所以可以将这些操作都归总到一个 `步骤（step）` 完成

第二阶段 `管道（Pipeline）` 名字为 **deploy**

注意：`管道（Pipeline）` 之间需要使用 `---` 相隔开

<img src=./images/05/45_01.png width=50% />


**deploy** `管道（Pipeline）`需要在 **build**  `管道（Pipeline）`执行完毕后才执行。

并且**deploy** `管道（Pipeline）` 并不需要获取代码

```yml
kind: pipeline
type: docker
name: deploy

depends_on: # 依赖build管道
  - build

clone:
  disable: true # 禁用拉取

```

### SSH连接并部署

之前说过，`Drone` 提供了多种 `Runner` 和 `管道（Pipeline）` 类型， 其中有 `SSH` 类型。但在当前容器化时代，使用容器化统一管理比较方便。


`Drone` 提供了 `SSH` 镜像插件， [**appleboy/drone-ssh**](https://plugins.drone.io/appleboy/drone-ssh/)。


在部署之前,需要先做预备工作。

#### Docker Compose 文件改动

1. 之前 **web** 项目的 `Docker Compose` 文件使用了具体 `Tag` 的镜像，将具体 `Tag` 换成 **latest**，服务器部署时不需要知道我当前为哪个版本，只部署最新版本就行
2. 取消对  **html** 目录的挂载。 **html** 数据并不推荐挂载到宿主机中，最后与镜像版本同步。 并且需要挂载到宿主机，在部署新版本时，需要清理宿主机中旧文件。

<img src=./images/05/46.png width=50% />


#### sh文件

既然将部署操作归总到一个步骤完成，那么可以将这些操作编写在一个 **.sh** 文件执行。 


```sh
#/bin/bash

# 拉取新镜像
docker pull yxs970707/deploy-web-demo:latest

#卸载旧容器
docker-compose -p web down

# 删除 web-nginx volume，重新创建
docker volume rm web-nginx

# 启动新容器
docker-compose -f /yml/docker-compose/web.yml -p web up -d

# 删除旧镜像
docker rmi $(docker images | grep deploy-web-demo | grep none | awk  '{print $3}')

```

1. 拉取新镜像
2. 卸载旧容器
3. 删除 Volume
4. 启动新容器
5. 删除旧镜像

第三个操作 可以 在 `Docker Compose`  使用外部 `Volume` ，预见创建 `Volume` ，这样就不需要删除  `Volume`。

最后一个操作是删除旧的镜像，当拉取新的 **latest** 镜像，旧 **latest** 镜像的 `Tag` 会变成 **none**，所以当前镜像为 **none** 标签的即可


#### 进行部署

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
        - sudo sh /sh/docker/web/deploy.sh
        - echo ====部署成功=======
```

<img src=./images/05/47.png width=50% />
<img src=./images/05/48.png width=50% />
<img src=./images/05/49.png width=50% />

