'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/impactController');
const integrityController = require('../controllers/integrityController');

router.get('/summary', authenticate, requireDatabase, asyncHandler(controller.summary));
router.get('/:entityType/:id', authenticate, requireDatabase, asyncHandler(integrityController.impact));

module.exports = router;
