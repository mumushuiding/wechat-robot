npm install -g forever

forever -h

forever start app.js

报错： Error: EPERM: operation not permitted, open 'F:\nodejs\node_golbal\forever.ps1'

以管理员方式运行cmd,然后 npm install -g forever


forever命令行的中文解释
子命令actions：

start:启动守护进程
stop:停止守护进程
stopall:停止所有的forever进程
restart:重启守护进程
restartall:重启所有的foever进程
list:列表显示forever进程
config:列出所有的用户配置项
set <key> <val>: 设置用户配置项
clear <key>: 清楚用户配置项
logs: 列出所有forever进程的日志
logs <script|index>: 显示最新的日志
columns add <col>: 自定义指标到forever list
columns rm <col>: 删除forever list的指标
columns set<cols>: 设置所有的指标到forever list
cleanlogs: 删除所有的forever历史日志