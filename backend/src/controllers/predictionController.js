'use strict';

const predictionService = require('../services/predictionService');

async function list(req, res) {
  res.json({ success: true, data: await predictionService.list() });
}

async function get(req, res) {
  const item = await predictionService.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: item });
}

async function create(req, res) {
  const record = await predictionService.create(req.body, req.user);
  res.status(201).json({ success: true, data: record });
}

async function infer(req, res) {
  const result = await predictionService.infer(req.body, req.user);
  res.status(201).json({ success: true, data: result });
}

async function verify(req, res) {
  const result = await predictionService.verify(req.params.id, req.user);
  res.json({ success: true, data: { asset: result.asset, result: result.verified ? 'VERIFIED' : 'TAMPERED', incident: result.incident || null } });
}

module.exports = { list, get, create, infer, verify };
