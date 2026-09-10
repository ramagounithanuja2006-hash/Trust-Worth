'use strict';

const Image = require('../models/Image');
const recordService = require('./recordService');
const pipelineEventService = require('./pipelineEventService');
const integrityService = require('./integrityService');
const incidentService = require('./incidentService');

async function list() {
  return recordService.list(Image);
}

async function get(id) {
  return recordService.get(Image, id);
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
  let status = verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UPLOADED';
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

  const record = await Image.create({
    contributor: user.contributor,
    uploadedBy: user._id,
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
    entityType: 'Image',
    entityId: record._id,
    sha256: actualSha256,
    payload: { originalName: file.originalname, verificationStatus, status }
  });

  await pipelineEventService.log({
    eventType: 'HASH_CREATED',
    actor: user._id,
    contributor: user.contributor,
    entityType: 'Image',
    entityId: record._id,
    sha256: actualSha256
  });

  if (!matched) {
    await incidentService.create({
      type: 'HASH_MISMATCH',
      severity: 'high',
      description: 'Image SHA-256 did not match the expected hash',
      entityType: 'Image',
      entityId: record._id,
      contributor: user.contributor,
      expectedHash: expectedSha256,
      actualHash: actualSha256,
      actionTaken: 'File moved to quarantine',
      reportedBy: user._id
    });
    await pipelineEventService.log({
      eventType: 'QUARANTINE',
      actor: user._id,
      contributor: user.contributor,
      entityType: 'Image',
      entityId: record._id,
      sha256: actualSha256
    });
  }

  return record;
}

async function verify(id, expectedSha256, user) {
  const record = await Image.findById(id);
  if (!record) return null;
  const actualSha256 = record.storagePath ? await integrityService.hashUploadedFile(record.storagePath) : (record.actualSha256 || record.sha256);
  const { verificationStatus, matched } = integrityService.compareHashes(expectedSha256, actualSha256);
  record.expectedSha256 = expectedSha256.toLowerCase();
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
  await pipelineEventService.log({
    eventType: 'VERIFICATION',
    actor: user && user._id,
    contributor: user && user.contributor,
    entityType: 'Image',
    entityId: record._id,
    sha256: record.sha256,
    payload: { verificationStatus }
  });
  return record;
}

module.exports = { list, get, createFromUpload, verify };
