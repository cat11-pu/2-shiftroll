# shiftroll

值班轮值工作台（原生 ES 模块，零依赖）：名册环形轮值、请假跳过、排错了可以撤销最近一天。左边日历条，右边操作与统计。

## 起服务看页面

    python3 -m http.server 8000

浏览器打开 http://127.0.0.1:8000/ 即可操作。

## 测试

    node tests/run.js

## 场景自检

    node check_sample.js
