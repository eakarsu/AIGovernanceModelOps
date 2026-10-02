const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.API_PROXY_TARGET || `http://127.0.0.1:${process.env.BACKEND_PORT || 3041}`;
  app.use('/api', createProxyMiddleware({ target, changeOrigin: true }));
};
