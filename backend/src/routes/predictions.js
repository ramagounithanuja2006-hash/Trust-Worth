'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/predictionController');

router.use(authenticate, requireDatabase);
router.post('/infer', asyncHandler(controller.infer));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));
router.post('/:id/verify', asyncHandler(controller.verify));

module.exports = router;
