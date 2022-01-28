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