'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');
const { imageUpload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/imageController');

router.use(authenticate, requireDatabase);
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', imageUpload, asyncHandler(controller.upload));
router.post('/:id/verify', asyncHandler(controller.verify));

module.exports = router;
