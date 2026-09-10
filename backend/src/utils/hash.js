'use strict';

const crypto = require('crypto');
const fs = require('fs');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashBuffer(buffer) {
  return sha256(buffer);
}

async function hashFile(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  return hashBuffer(buffer);
}

module.exports = { sha256, hashBuffer, hashFile };
