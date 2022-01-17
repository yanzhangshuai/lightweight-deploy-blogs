#/bin/bash

# 设置多个环境变量到 environment variable
# echo -e "set \$variable1 $PATH;
# set \$variable2 $PATH;
# set \$variable3 $PATH;" >

# 设置单个环境变量到 environment variable
echo set \$SERVER_URL $SERVER_URL\; > /etc/nginx/conf.d/server.variable