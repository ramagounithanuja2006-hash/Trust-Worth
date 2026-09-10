const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const PipelineEvent = require('../models/PipelineEvent');
router.get('/', authenticate, asyncHandler(async (req, res) => res.json({ success: true, data: await PipelineEvent.find({}).sort({ createdAt: -1 }).limit(200).lean() })));
module.exports = router;
