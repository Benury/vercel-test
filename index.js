
// 导入 Express 框架
const express = require('express');

// 创建 Express 应用程序
const app = express();

const PORT = process.env.PORT || 3000;

// 创建路由处理 GET / 请求
app.get('/data', (req, res) => {
    res.send('Hello, World!');
});

// 启动服务器，监听端口 3000
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
