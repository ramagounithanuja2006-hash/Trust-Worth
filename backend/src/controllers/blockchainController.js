'use strict';

const blockchainService = require('../services/blockchainService');

async function list(req, res) {
  res.json({ success: true, data: await blockchainService.list() });
}

async function get(req, res) {
  const item = await blockchainService.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: item });
}

async function create(req, res) {
  const record = await blockchainService.recordEvidence(req.body, req.user);
  res.status(201).json({ success: true, data: record });
}

async function anchor(req, res) {
  const evidence = await blockchainService.anchorEvidence(req.body, req.user);
  res.json({ success: true, data: evidence });
}

module.exports = { list, get, create, anchor };
