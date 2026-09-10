'use strict';

const { isDatabaseConnected } = require('../config/db');

function health(req, res) {
  const database = isDatabaseConnected() ? 'connected' : 'unavailable';
  res.status(200).json({
    success: true,
    status: database === 'connected' ? 'ok' : 'degraded',
    service: 'visiontrust-backend',
    database,
    timestamp: new Date().toISOString()
  });
}

module.exports = { health };
