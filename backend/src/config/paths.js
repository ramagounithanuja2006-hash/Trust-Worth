'use strict';

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '../..');
const uploadsRoot = path.join(rootDir, 'uploads');

const uploadDirs = {
  images: path.join(uploadsRoot, 'images'),
  models: path.join(uploadsRoot, 'models'),
  quarantine: path.join(uploadsRoot, 'quarantine')
};

function ensureUploadDirs() {
  Object.values(uploadDirs).forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
}

ensureUploadDirs();

module.exports = {
  rootDir,
  uploadsRoot,
  uploadDirs,
  ensureUploadDirs
};
