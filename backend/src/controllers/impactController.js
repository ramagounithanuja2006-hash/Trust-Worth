'use strict';

const impactService = require('../services/impactService');

async function summary(req, res) {
  res.json({ success: true, data: await impactService.summary() });
}

module.exports = { summary };
