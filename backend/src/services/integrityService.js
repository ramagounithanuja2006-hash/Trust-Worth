'use strict';

const fs = require('fs');
const path = require('path');
const { hashFile, sha256 } = require('../utils/hash');
const { uploadDirs } = require('../config/paths');
const Image = require('../models/Image');
const AIModel = require('../models/AIModel');
const Prediction = require('../models/Prediction');
const incidentService = require('./incidentService');
const pipelineEventService = require('./pipelineEventService');

function compareHashes(expected, actual) {
  if (!expected) {
    return { verificationStatus: 'UNVERIFIED', matched: true };
  }
  const matched = expected.toLowerCase() === actual.toLowerCase();
  return {
    verificationStatus: matched ? 'VERIFIED' : 'TAMPERED',
    matched
  };
}

async function quarantineFile(storagePath) {
  if (!storagePath || !fs.existsSync(storagePath)) return storagePath;
  const destination = path.join(uploadDirs.quarantine, path.basename(storagePath));
  await fs.promises.rename(storagePath, destination);
  return destination;
}

async function hashUploadedFile(filePath) {
  return hashFile(filePath);
}

async function verifyStoredAsset(type, id, actor) {
  const Model = type === 'Image' ? Image : type === 'AIModel' ? AIModel : type === 'Prediction' ? Prediction : null;
  if (!Model) throw Object.assign(new Error('Unsupported asset type'), { statusCode: 400 });
  const asset = await Model.findById(id);
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  const actual = type === 'Prediction'
    ? sha256(JSON.stringify(asset.output))
    : (asset.storagePath && fs.existsSync(asset.storagePath) ? await hashFile(asset.storagePath) : (asset.actualSha256 || asset.sha256));
  const expected = type === 'Prediction' ? (asset.expectedOutputSha256 || asset.outputSha256) : (asset.expectedSha256 || asset.sha256);
  const result = compareHashes(expected, actual);
  asset.actualSha256 = actual;
  asset.verificationStatus = result.verificationStatus;
  if (type === 'Prediction') asset.status = result.matched ? 'COMPLETED' : 'BLOCKED';
  else asset.status = result.matched ? 'VERIFIED' : 'BLOCKED';
  if (!result.matched) {
    if (asset.storagePath) asset.storagePath = await quarantineFile(asset.storagePath);
    asset.status = 'BLOCKED';
    asset.quarantineStatus = 'QUARANTINED';
    asset.quarantinedAt = new Date();
    asset.blockedReason = 'SHA-256 mismatch during verification';
  }
  await asset.save();
  await pipelineEventService.log({ eventType: 'VERIFICATION', actor, contributor: asset.contributor, entityType: type, entityId: asset._id, sha256: actual, payload: { expected, actual, result: result.verificationStatus } });
  let incident;
  if (!result.matched) {
    const Incident = require('../models/Incident');
    incident = await Incident.findOne({ type: 'HASH_MISMATCH', entityType: type, entityId: asset._id, actualHash: actual }).lean();
    if (!incident) incident = await incidentService.create({ type: 'HASH_MISMATCH', severity: 'high', description: `${type} SHA-256 did not match expected hash`, entityType: type, entityId: asset._id, contributor: asset.contributor, expectedHash: expected, actualHash: actual, actionTaken: 'Asset blocked and moved to quarantine', reportedBy: actor });
  }
  return { asset, verified: result.matched, incident };
}

module.exports = { compareHashes, quarantineFile, hashUploadedFile, verifyStoredAsset };
