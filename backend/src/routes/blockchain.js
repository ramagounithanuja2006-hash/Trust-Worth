'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/blockchainController');

router.use(authenticate, requireDatabase);
router.post('/anchor', asyncHandler(controller.anchor));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));

module.exports = router;
