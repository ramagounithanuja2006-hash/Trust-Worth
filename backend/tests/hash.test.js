'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { sha256, hashBuffer, hashFile } = require('../src/utils/hash');

test('sha256 hashes a string', () => {
  expect(sha256('visiontrust')).toHaveLength(64);
});

test('hashBuffer matches sha256', () => {
  const buffer = Buffer.from('integrity');
  expect(hashBuffer(buffer)).toBe(sha256(buffer));
});

test('hashFile hashes disk contents', async () => {
  const filePath = path.join(os.tmpdir(), `visiontrust-hash-${Date.now()}.txt`);
  fs.writeFileSync(filePath, 'pipeline-file');
  const digest = await hashFile(filePath);
  fs.unlinkSync(filePath);
  expect(digest).toBe(sha256('pipeline-file'));
});
