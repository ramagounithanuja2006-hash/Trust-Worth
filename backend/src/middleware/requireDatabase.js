'use strict';

const { isDatabaseConnected } = require('../config/db');

function requireDatabase(req, res, next) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database is unavailable' });
  }
  return next();
}

module.exports = { requireDatabase };
