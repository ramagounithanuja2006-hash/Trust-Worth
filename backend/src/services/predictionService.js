'use strict';

const Prediction = require('../models/Prediction');
const Image = require('../models/Image');
const AIModel = require('../models/AIModel');
const recordService = require('./recordService');
const pipelineEventService = require('./pipelineEventService');
const { sha256 } = require('../utils/hash');
const aiService = require('./aiService');
const integrityService = require('./integrityService');
const incidentService = require('./incidentService');
const trustService = require('./trustService');
const blockchainService = require('./blockchainService');

async function list() {
  return recordService.list(Prediction);
}

async function get(id) {
  return Prediction.findById(id).populate('image').populate('aiModel').lean();
}

async function create(data, user) {
  const imageId = data.image || data.imageId;
  const aiModelId = data.aiModel || data.modelId || data.aiModelId;
  if (!imageId || !aiModelId) {
    const error = new Error('image and aiModel are required');
    error.statusCode = 400;
    throw error;
  }

  const image = await Image.findById(imageId);
  const aiModel = await AIModel.findById(aiModelId);
  if (!image || !aiModel) {
    const error = new Error('Referenced image or model was not found');
    error.statusCode = 404;
    throw error;
  }

  const imageCheck = await integrityService.verifyStoredAsset('Image', image._id, user._id);
  if (!imageCheck.verified) {
    const error = new Error('Image integrity verification failed; inference blocked');
    error.statusCode = 423;
    throw error;
  }
  const modelCheck = await integrityService.verifyStoredAsset('AIModel', aiModel._id, user._id);
  if (!modelCheck.verified) {
    const error = new Error('Model integrity verification failed; inference blocked');
    error.statusCode = 423;
    throw error;
  }

  if (image.status === 'QUARANTINED' || image.status === 'BLOCKED' || image.verificationStatus === 'TAMPERED') {
    const error = new Error('Cannot create a prediction from a blocked or tampered image');
    error.statusCode = 409;
    throw error;
  }
  if (aiModel.status === 'QUARANTINED' || aiModel.status === 'BLOCKED' || aiModel.verificationStatus === 'TAMPERED') {
    const error = new Error('Cannot create a prediction from a blocked or tampered model');
    error.statusCode = 409;
    throw error;
  }

  const outputSha256 = data.output ? sha256(JSON.stringify(data.output)) : undefined;
  const expectedOutputSha256 = data.expectedOutputSha256 || outputSha256;
  let verificationStatus = 'UNVERIFIED';
  if (data.expectedOutputSha256 && outputSha256) {
    verificationStatus = data.expectedOutputSha256.toLowerCase() === outputSha256 ? 'VERIFIED' : 'TAMPERED';
  }

  if (verificationStatus === 'TAMPERED') {
    const record = await Prediction.create({ image: image._id, aiModel: aiModel._id, contributor: user.contributor || image.contributor, output: data.output, expectedOutputSha256, outputSha256, verificationStatus, status: 'BLOCKED', blockedReason: 'Prediction output hash mismatch' });
    await incidentService.create({ type: 'HASH_MISMATCH', severity: 'high', description: 'Prediction output hash did not match expected hash', entityType: 'Prediction', entityId: record._id, contributor: user.contributor || image.contributor, expectedHash: expectedOutputSha256, actualHash: outputSha256, actionTaken: 'Prediction blocked', reportedBy: user._id });
    return record;
  }

  const record = await Prediction.create({
    image: image._id,
    aiModel: aiModel._id,
    contributor: user.contributor || image.contributor,
    createdBy: user._id,
    imageHash: image.actualSha256 || image.sha256,
    modelHash: aiModel.actualSha256 || aiModel.sha256,
    output: data.output,
    prediction: data.prediction || data.output,
    confidence: data.confidence,
    expectedOutputSha256,
    outputSha256,
    verificationStatus,
    status: data.output ? 'COMPLETED' : 'QUEUED',
    inferenceReference: data.inferenceReference,
    blockedReason: verificationStatus === 'TAMPERED' ? 'Prediction output hash mismatch' : undefined
  });

  await pipelineEventService.log({
    eventType: 'PREDICTION',
    actor: user._id,
    contributor: user.contributor,
    entityType: 'Prediction',
    entityId: record._id,
    sha256: outputSha256,
    payload: { status: record.status, verificationStatus }
  });

  return record;
}

async function requestInference(payload) {
  return aiService.requestInference(payload);
}

async function infer(data, user) {
  const imageId = data.image || data.imageId;
  const aiModelId = data.aiModel || data.modelId || data.aiModelId;
  if (!imageId || !aiModelId) {
    const error = new Error('image and aiModel are required');
    error.statusCode = 400;
    throw error;
  }
  const image = await Image.findById(imageId);
  const aiModel = await AIModel.findById(aiModelId);
  if (!image || !aiModel) {
    const error = new Error('Referenced image or model was not found');
    error.statusCode = 404;
    throw error;
  }
  const imageCheck = await integrityService.verifyStoredAsset('Image', image._id, user._id);
  const modelCheck = imageCheck.verified ? await integrityService.verifyStoredAsset('AIModel', aiModel._id, user._id) : { verified: false };
  if (!imageCheck.verified || !modelCheck.verified || ['BLOCKED', 'QUARANTINED'].includes(image.status) || ['BLOCKED', 'QUARANTINED'].includes(aiModel.status)) {
    const error = new Error('Inference blocked because image or model integrity verification failed');
    error.statusCode = 423;
    throw error;
  }
  const result = await aiService.requestInference({
    imageId: image._id,
    modelId: aiModel._id,
    imageHash: image.actualSha256 || image.sha256,
    modelHash: aiModel.actualSha256 || aiModel.sha256,
    imagePath: image.storagePath,
    modelPath: aiModel.storagePath,
    parameters: data.parameters || {}
  });
  if (result.prediction === undefined) {
    const error = new Error('AI service returned no prediction');
    error.statusCode = 502;
    throw error;
  }
  const prediction = await create({
    image: image._id,
    aiModel: aiModel._id,
    output: result.prediction,
    prediction: result.prediction,
    confidence: result.confidence,
    expectedOutputSha256: result.predictionHash,
    inferenceReference: result.inferenceReference
  }, user);
  const trustScore = await trustService.saveContributorScore(user.contributor || image.contributor);
  let blockchainEvidence;
  if (prediction.verificationStatus === 'VERIFIED') {
    try {
      blockchainEvidence = await blockchainService.anchorEvidence({ entityType: 'Prediction', entityId: prediction._id, assetType: 'Prediction', assetId: prediction._id, hash: prediction.outputSha256, eventType: 'PREDICTION', contributorId: user.contributor || image.contributor, metadata: { imageId: image._id, modelId: aiModel._id } }, user);
      prediction.blockchainEvidence = blockchainEvidence._id;
      await prediction.save();
    } catch (error) {
      blockchainEvidence = error.evidence;
    }
  }
  const decision = prediction.verificationStatus === 'VERIFIED' && blockchainEvidence && blockchainEvidence.status === 'confirmed' ? 'ALLOW' : 'BLOCK';
  return { prediction, confidence: result.confidence, trustScore, blockchainEvidence, decision };
}

async function verify(id, user) {
  return integrityService.verifyStoredAsset('Prediction', id, user && user._id);
}

module.exports = { list, get, create, verify, requestInference, infer };
