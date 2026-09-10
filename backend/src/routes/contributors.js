'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/contributorController');
const integrityController = require('../controllers/integrityController');

router.use(authenticate, requireDatabase);
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.get('/:id/history', asyncHandler(integrityController.contributorHistory));
router.post('/', asyncHandler(controller.create));

module.exports = router;
