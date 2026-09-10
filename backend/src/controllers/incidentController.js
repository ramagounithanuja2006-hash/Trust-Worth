'use strict';

const incidentService = require('../services/incidentService');

async function list(req, res) {
  res.json({ success: true, data: await incidentService.list() });
}

async function get(req, res) {
  const item = await incidentService.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: item });
}

async function create(req, res) {
  const payload = {
    ...req.body,
    reportedBy: req.user._id,
    contributor: req.body.contributor || req.user.contributor
  };
  const record = await incidentService.create(payload);
  res.status(201).json({ success: true, data: record });
}

module.exports = { list, get, create };
