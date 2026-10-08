const serverModule = require('./dist/server.js');
const app = serverModule?.default ?? serverModule;

if (typeof app !== 'function') {
  throw new TypeError('Vercel backend entrypoint did not export an Express application.');
}

module.exports = app;
