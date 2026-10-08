const serverModule = require('./dist/server.js');
const app = serverModule?.default ?? serverModule;

if (typeof app !== 'function') {
  throw new TypeError('Nextess backend must export an Express application.');
}

module.exports = app;
