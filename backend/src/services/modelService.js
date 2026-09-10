'use strict';

const AIModel = require('../models/AIModel');
const recordService = require('./recordService');
const pipelineEventService = require('./pipelineEventService');
const integrityService = require('./integrityService');
const incidentService = require('./incidentService');

async function list() {
  return recordService.list(AIModel);
}

async function get(id) {
  return recordService.get(AIModel, id);
}

async function createFromUpload({ file, user, body }) {
  if (!file) {
    const error = new Error('A file field is required');
    error.statusCode = 400;
    throw error;
  }

  const actualSha256 = await integrityService.hashUploadedFile(file.path);
  const expectedSha256 = (body.expectedSha256 || actualSha256).toLowerCase();
  const { verificationStatus, matched } = integrityService.compareHashes(body.expectedSha256, actualSha256);

  let storagePath = file.path;
  let status = verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'REGISTERED';
  let quarantineStatus = 'NONE';
  let quarantinedAt;
  let blockedReason;

  if (!matched) {
    storagePath = await integrityService.quarantineFile(file.path);
    status = 'BLOCKED';
    quarantineStatus = 'QUARANTINED';
    quarantinedAt = new Date();
    blockedReason = 'SHA-256 mismatch between expected and actual hash';
  }

  const record = await AIModel.create({
    contributor: user.contributor,
    uploadedBy: user._id,
    name: body.name || file.originalname,
    version: body.version || '1.0.0',
    framework: body.framework,
    originalName: file.originalname,
    storagePath,
    mimeType: file.mimetype,
    size: file.size,
    sha256: actualSha256,
    expectedSha256,
    actualSha256,
    verificationStatus,
    status,
    quarantineStatus,
    quarantinedAt,
    blockedReason
  });

  await pipelineEventService.log({
    eventType: 'UPLOAD',
    actor: user._id,
    contributor: user.contributor,
    entityType: 'AIModel',
    entityId: record._id,
    sha256: actualSha256,
    payload: { name: record.name, version: record.version, verificationStatus, status }
  });

  if (!matched) {
    await incidentService.create({
      type: 'HASH_MISMATCH',
      severity: 'critical',
      description: 'Model SHA-256 did not match the expected hash',
      entityType: 'AIModel',
      entityId: record._id,
      contributor: user.contributor,
      expectedHash: expectedSha256,
      actualHash: actualSha256,
      actionTaken: 'File moved to quarantine',
      reportedBy: user._id
    });
  }

  return record;
}

async function verify(id, expectedSha256, user) {
  const record = await AIModel.findById(id);
  if (!record) return null;
  const expected = (expectedSha256 || record.expectedSha256 || record.sha256).toLowerCase();
  const actualSha256 = record.storagePath ? await integrityService.hashUploadedFile(record.storagePath) : (record.actualSha256 || record.sha256);
  const { verificationStatus, matched } = integrityService.compareHashes(expected, actualSha256);
  record.expectedSha256 = expected;
  record.verificationStatus = verificationStatus;
  record.actualSha256 = actualSha256;
  record.status = matched ? 'VERIFIED' : 'BLOCKED';
  record.quarantineStatus = matched ? 'NONE' : 'QUARANTINED';
  if (!matched) {
    record.storagePath = await integrityService.quarantineFile(record.storagePath);
    record.quarantinedAt = new Date();
    record.blockedReason = 'SHA-256 mismatch during verification';
  }
  await record.save();
  await pipelineEventService.log({ eventType: 'VERIFICATION', actor: user && user._id, contributor: user && user.contributor, entityType: 'AIModel', entityId: record._id, sha256: record.sha256, payload: { verificationStatus } });
  if (!matched) await incidentService.create({ type: 'HASH_MISMATCH', severity: 'critical', description: 'Model SHA-256 did not match during verification', entityType: 'AIModel', entityId: record._id, contributor: user && user.contributor, expectedHash: expected, actualHash: record.actualSha256 || record.sha256, actionTaken: 'Model moved to quarantine', reportedBy: user && user._id });
  return record;
}

module.exports = { list, get, createFromUpload, verify };
