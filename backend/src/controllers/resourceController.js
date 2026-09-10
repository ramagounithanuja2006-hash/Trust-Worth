const service = require('../services/recordService');
const { isDatabaseConnected } = require('../config/db');

function controller(Model) {
  return {
    list: async (req, res) => { if (!isDatabaseConnected()) return res.status(503).json({ success: false, message: 'Database is unavailable' }); res.json({ success: true, data: await service.list(Model) }); },
    get: async (req, res) => { if (!isDatabaseConnected()) return res.status(503).json({ success: false, message: 'Database is unavailable' }); const item = await service.get(Model, req.params.id); if (!item) return res.status(404).json({ success: false, message: 'Resource not found' }); res.json({ success: true, data: item }); },
    create: async (req, res) => { if (!isDatabaseConnected()) return res.status(503).json({ success: false, message: 'Database is unavailable' }); res.status(201).json({ success: true, data: await service.create(Model, req.body) }); }
  };
}
module.exports = controller;
