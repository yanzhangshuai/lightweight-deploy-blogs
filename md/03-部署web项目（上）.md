这一篇中主要是将前端项目打包 `Docker` 并部署到服务器。

部署的前端项目是 曾经搞的一个 `VUE` 模板项目：https://github.com/orca-studio/vue-template/tree/vite-3.X

<img src=./images/03/01.png width=50%/>

> PS：当前还未使用持续集成和私有化仓库，所以目前步骤是本地打包 `Docker` 镜像，上传 `DockerHub`，随后在服务器拉去镜像，启动。
>
> 需要本地具有 `Docker` 环境。可以在 [`Docker` 官网](https://www.docker.com/products/docker-desktop)下载 。
> `windows` 系统对系统具有一定要求，并且需要开启 `Hyper-V` ，具体怎么设置网上具有很多教程。不再赘述

<br/>

# 构建镜像

当自己项目使用 `Docker` 容器化部署的时，那么将需要先项目打包为一个 `镜像(Image)`，使用此镜像进行启动容器。

第一步操作就是制作`镜像（Image）`。

> `镜像（Image）` 就是一个进程运行时所使用的资源。

`Docker` 提供了制作 `镜像(Image)` 的方式，编写 `Dockerfile` 配置文件，运行 **build** 命令。

制作`镜像（Image）` 的关键 就在于 `Dockerfile` 文件

制作镜像时，需要提供一个 `上下文目录（Context）`（一般来说上下文目录会设置为项目根目录）。
`Docker` 会将`上下文目录（Context）` 与子目录结构发送到 **Docker 引擎** 中，**Docker 引擎** 根据这个目录结构去构建 `镜像 (Image)`。

默认情况下 `Docker` 会读取 `上下文目录（Context）` 下名为 `Dockerfile` 的文件作为配置文件，
所以这就是一般都会将 `Dockerfile` 文件放在根目录的原因。

当然也可以放在其它目录，在命令行中使用参数指定 `Dockerfile` 文件

> PS: 注意：在构建 `镜像` 时不允许访问 `上下文目录(Context)` 之外的目。

<br/>

## Dockerfile

为了管理方便，将所有的部署相关的放在 **deploy** 目录下。

<img src=./images/03/02.png  width=50%/>

```Dockerfile
FROM nginx:latest

# 将代码copy到镜像
COPY ../dist /usr/share/nginx/html

# 将 nginx 配置文件 copy 到容器内配置文件的目录下
COPY ../deploy/nginx.conf /etc/nginx

# 容器应用端口
EXPOSE 80
```

> PS：`Dockerfile` 具有好多指令，在此只介绍使用到的指令，其它指令有兴趣的朋友可以自行查询

- 第一行 **FROM** 指令表示使用依赖镜像，制作应用级别的镜像，都需要依赖运行环境。web 项目则需要 `Nginx` 服务器运行。

  > PS： 之前说过， 镜像是分层的，制作的镜像可以简单的理解为在现有镜像上添加一层。产生一个新的镜像。

- 第二行 **COPY** 命令表示 复制文件，将本地的目录或者文件 打包到镜像指定目录下。将 **./dist** 目录，也就是打包器打包后生成的代码目录复制到 镜像中的 **/usr/share/nginx/html** 目录

  > PS：所有相对目录都是以 `上下文目录(Context)` 为基准，所以 **dist** 目录访问时 **./dist**，而非 **../dist**。

- 第三行 **COPY** 命令表示将 **nginx.conf** 配置文件 复制到 **/etc/nginx**。

  > PS：所有相对目录都是以 `上下文目录(Context)` 为基准，所以 **nginx.conf** 目录访问时 **./deploy/nginx.conf**，而非 **./nginx.conf**。

  web 项目 `容器`，内存运行的是 `Nginx`，项目 `镜像（Image）` 中的 `Nginx` 服务器。 自己制作的 `镜像(Image)` 只是将生成的静态文件挂载到 `Nginx` 上。
  **nginx.conf** 配置文件是用来配置 `Nginx` 挂载路由等信息。

- 第四行 **EXPOSE** 命令暴露端口号，启动容器时使用 `ports` 映射容器内部的端口号就是此命令暴露出的。

> `Nginx` 镜像中，暴露了 **80** 端口运行 `Nginx` 服务器，`Dockerfile` 中只暴露 **80** 端口，在启动时 **80** 端口直接启动的是 `Nginx` 服务器。

注意：不允许直接使用 **./nginx.conf** 访问，会被识别成以 `上下文目录（Context）` 下的 **nginx.conf**

<img src=./images/03/02_01.png  width=50%/>

但是允许以 `上下文(目录)`为相对目录的基准目录。

<br/>

## nginx.conf

在 **deploy/nginx.conf** 文件中编写 `Nginx` 配置。 `镜像（Image）`打包时会复制此文件到镜像中

> PS： 也可以使用类似上一篇中的将 `nginx.conf` 挂载到宿主环境中。那种方案优势更好一些。

```conf
events {
    worker_connections  1024;
}

http {
    include mime.types;
    default_type text/html;
    sendfile on;
    keepalive_timeout 65;
    charset utf-8;
    error_log  /var/log/nginx/error.log;
    access_log  /var/log/nginx/access.log;
    server {
        listen       80;

        location / {
            root    /usr/share/nginx/html;
            index  index.html index.htm;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

- root： 此属性设置根目录，当前根目录设置为 **/usr/share/nginx/html**，此目录由 **./dist** 目录复制过去。
- index: 此属性指定网站初始页面。 也就是 **/usr/share/nginx/html/index.html**
- try_files： 此属性将所有的访问都转为 **index.html** 。单页面程序的路由都是请求的同一个 `HTML`，由 `JS` 内部判断的路由页面
  类似 `webpack-dev-server` 中的 **historyApiFallback** 属性

<br/>

## 执行构建

执行构建 `镜像（Image）` 的命令是 `docker build`。

为了方便执行，在 `package.json` 中添加 **deploy** 命令执行构建

<img src=./images/03/03.png  width=50%/>

在每次构建 `镜像（Image）` 之前，先进行项目编译。也就是执行 `npm run build` 命令，打包新的代码。当编译成功后执行 `docker build` 。

> PS： `npm-run-all` 是使用的一个 [NPM 包](https://www.npmjs.com/package/npm-run-all)，用于执行多个脚本

> PS： `Docker Hub` 没有账号的可以先进行注册：https://hub.docker.com/

`docker build` 命令中使用了几个参数

- -t 构建的镜像名称。 其中 **yxs970707** 是我在 `Docker Hub` 中的用户名称。当前还没有构建私库，先推送到 `Docker Hub`,将 **yxs970707** 改为自己名称或组织即可。
  **:** 后的为当前镜像的 `标签(tag)`，一般情况下会设置版本号。
- -f `Dockerfile` 文件地址，因为`Dockerfile` 文件存在了 **deploy** 目录下，所以需要指定文件地址。
- 最后一个点 _._ 表示设置当前目录为 `上下文目录（Context）`。

> PS：`标签(tag)` 设置特别灵活，可以随意设置，所以 `标签(tag)` 需要自行注意管理
> PS： 构建镜像时可以设置多 `标签(tag)`,添加多个 **-t** 就行

此时，执行 `npm run deploy` 便可以构建`镜像（Image）`。构建`镜像（Image）`时，每一句命令都具有清晰的信息。构建成功后就可以在本地 `Docker` 中看到此镜像

> PS：第一次构建可能会慢一些，因为本地没有 `Nginx` 镜像，如果 pull。

> PS：`镜像（Image）` 的分层其实每一句命令都是一层。

<img src=./images/03/04.png width=50% />

<img src=./images/03/05.png width=50%/>

<br/>

## 测试镜像

构建完毕镜像后可以先在本地测试是否可以部署

<img src=./images/03/06.png width=50%/>

在此将本地 **3333** 端口号映射到了容器。可以根据情况随意设置未被使用的端口号，

如果未出意外的话将会启动一个 `容器`，并且最后状态为 **RUNNING**，成功启动后使用端口号进行访问。

<img src=./images/03/07.png width=50% />

<img src=./images/03/09.png width=50% />

如果启动时出错的话，可以点击容器查看具体错误日志

<img src=./images/03/08.png width=50% />

我在此成功启动并且可访问，如有未成功的可以查询日志，实在解决不了可以留言。

<br/>

## 推送 Docker Hub

本地测试完毕后,可以推送到 `Docker Hub` 中,然后由服务器拉取部署。

> PS：之后部署私有仓库之后可以推送到私有仓库

推送到 `Docker Hub` 很简单，只需要在 `Docker Desktop` 中登录账号然后 **push**

**push** 成功后就可以在 `Docker Hub` 中搜到镜像

<img src=./images/03/10.png width=50% />

<img src=./images/03/11.png width=50% />

<img src=./images/03/12.png width=50% />

<br/>

# 部署容器

## 最简部署

最简部署方案直接拉取设置端口号即可

> 拉取镜像可能有些延迟，因为 `Docker` 配置了国内源，需要时间来同步

```yml
version: '3.9'
services:
  nginx:
    image: yxs970707/deploy-web-demo:1.0.0
    container_name: web
    restart: always
    ports:
      - 7777:80
```

> PS：`镜像（Image）`的 `标签(tag)` 设置的为 **1.0.0**，拉取镜像时需要指定标签

使用 `Portainer` 部署完毕后就可以访问服务器进行访问。

<img src=./images/03/13.png width=50% />

<img src=./images/03/14.png width=50% />

<br/>

## volumes 挂载

在上面将所有文件都存放镜像中，并没有使用 `volumes` 将 **/usr/share/nginx/html** 目录挂载到宿主机中。
接下来就实现这一操作。

这一操作可以实现不更新镜像和容器直接更新前端项目操作。不过这样操作也并不推荐。但是具体怎么做，需要根据真实情况来决定。
下面就简单看一下这个步骤。

### 非具名 volumes 覆盖问题

在之前都是使用宿主目录直接挂载容器内目录。使用宿主目录直接挂载会在容器启动时使用宿主目录覆盖容器目录。

```yml
version: '3.9'

services:
  nginx:
    image: yxs970707/deploy-web-demo:1.0.0
    container_name: web
    restart: always
    ports:
      - 7777:80
    volumes:
      - /volumes/web/html:/usr/share/nginx/html
```

更新 `YMAL` 文件，添加了挂载 **/usr/share/nginx/html** 目录，
使用此文件重新部署后访问的话，`Nginx` 会提示 **403**，也就是根本没有找到该地址

<img src=./images/03/15.png width=50% />

> **/usr/share/nginx/html** 目录是存储前端文件的目录。

查询服务器，挂载目录并没有任何文件，并且进入容器内部查询 **/usr/share/nginx/html** 也发现并没有任何文件

<img src=./images/03/16.png width=50% />

<img src=./images/03/17.png width=50% />

> docker exec -it web /bin/sh 进入容器

也就是说 `Docker` 在启动容器时，会使用宿主目录覆盖容器内目录。

也可以在宿主目录创建一个文件进行测试，在此只贴出测试结果。有兴趣的可以自行测试。

<img src=./images/03/18.png width=50% />

<br/>

### 具名 Volumes

解决数据挂载问题，就需要创建具名的 Volumes。

在 `Docker` 中具有 `Volumes` 一套完整定义。 `Volume` 具有很强大的功能。甚至可以将数据挂载到其它机器上。
在此就不介绍 `Volume`，不了解的朋友可以自行查询。

<img src=./images/03/19.png width=50% />

`Volume` 可以使用命令先进行创建，然后在挂载时使用。当然也可以在 `Docker Compose` 定义 。

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

services:
  nginx:
    image: yxs970707/deploy-web-demo:1.0.0
    container_name: web
    restart: always
    ports:
      - 7777:80
    volumes:
      - web-html:/usr/share/nginx/html
```

`YAML` 文件中 **volumes** 就是创建一个具名的 `Volume`。

这个数据卷使用了本地数据卷，并且将数据卷绑定到 **/volumes/web/html** 目录
然后使用 **数据卷名称(web-html)** 挂载 **/usr/share/nginx/html**

注意，使用数据卷名称挂载时， **/volumes/web/html** 目录必须存在，并且目录下并无任何文件。

使用此 **yml** 部署的项目可以正常访问并且将完好的将数据挂载到 **/volumes/web/html**。

<img src=./images/03/20.png width=50% />

<img src=./images/03/21.png width=50% />

仔细观察的情况下， `Portainer` 可视化工具中在 `Volume` 项此时具有一个 **web-html** 的数据卷

<img src=./images/03/22.png width=50% />

在其详细信息中可以看到具体详情。

其中具有一个 **Mount path** 属性，这个属性值是此数据卷的目录。

其实在 `Docker` 挂载数据卷时，会将此目录与容器内进行挂载。

另外还有一个 **device** 属性，这个数据是与数据卷绑定的目录。Linux 具有一种可以将 **Mount path** 和 **device** 绑定为类似一个目录方案

当然还可以使用其它绑定方案，将数据卷绑定到其它目录。甚至可以绑定到其它机器

<img src=./images/03/23.png width=50% />

F
