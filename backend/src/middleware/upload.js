'use strict';

const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const { uploadDirs, ensureUploadDirs } = require('../config/paths');

ensureUploadDirs();

const folders = { image: uploadDirs.images, model: uploadDirs.models };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = folders[req.uploadType] || uploadDirs.quarantine;
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

function createUpload(type) {
  const allowed = type === 'image'
    ? /^image\/(jpeg|png|webp|tiff)$/i
    : /^(application\/zip|application\/x-zip-compressed|application\/octet-stream|application\/x-onnx|application\/x-tar|application\/gzip)$/i;

  return (req, res, next) => {
    req.uploadType = type;
    multer({
      storage,
      limits: { fileSize: env.uploadMaxMb * 1024 * 1024 },
      fileFilter: (request, file, cb) => (
        allowed.test(file.mimetype)
          ? cb(null, true)
          : cb(Object.assign(new Error('Unsupported file type'), { statusCode: 400 }))
      )
    }).single('file')(req, res, next);
  };
}

module.exports = { imageUpload: createUpload('image'), modelUpload: createUpload('model') };
