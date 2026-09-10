'use strict';

const imageService = require('../services/imageService');

async function list(req, res) {
  res.json({ success: true, data: await imageService.list() });
}

async function get(req, res) {
  const item = await imageService.get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: item });
}

async function upload(req, res) {
  const record = await imageService.createFromUpload({
    file: req.file,
    user: req.user,
    body: req.body
  });
  res.status(201).json({ success: true, data: record });
}

async function verify(req, res) {
  const expectedSha256 = req.body.expectedSha256;
  if (!expectedSha256) {
    return res.status(400).json({ success: false, message: 'expectedSha256 is required' });
  }
  const record = await imageService.verify(req.params.id, expectedSha256, req.user);
  if (!record) return res.status(404).json({ success: false, message: 'Resource not found' });
  res.json({ success: true, data: record });
}

module.exports = { list, get, upload, verify };
