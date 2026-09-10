'use strict';

const modelService = require('../services/modelService');

async function list(req, res) {
  res.json({ success: true, data: await modelService.list() });
}

async function get(req, res) {
  const item = await modelService.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: item });
}

async function upload(req, res) {
  const record = await modelService.createFromUpload({
    file: req.file,
    user: req.user,
    body: req.body
  });
  res.status(201).json({ success: true, data: record });
}

async function verify(req, res) {
  const record = await modelService.verify(req.params.id, req.body.expectedSha256, req.user);
  if (!record) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: record });
}

module.exports = { list, get, upload, verify };
