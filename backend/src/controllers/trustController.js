'use strict';

const trustService = require('../services/trustService');

async function list(req, res) {
  res.json({ success: true, data: await trustService.list() });
}

async function get(req, res) {
  const item = await trustService.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: item });
}

async function create(req, res) {
  const record = await trustService.create(req.body, req.user);
  res.status(201).json({ success: true, data: record });
}

module.exports = { list, get, create };
