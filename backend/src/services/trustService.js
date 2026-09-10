'use strict';

const TrustScore = require('../models/TrustScore');
const recordService = require('./recordService');
const Image = require('../models/Image');
const AIModel = require('../models/AIModel');
const Prediction = require('../models/Prediction');
const Incident = require('../models/Incident');
const BlockchainEvidence = require('../models/BlockchainEvidence');

function clampScore(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return Math.max(0, Math.min(100, numeric));
}

async function list() {
  return recordService.list(TrustScore);
}

async function get(id) {
  return recordService.get(TrustScore, id);
}

async function create(data, user) {
  const score = clampScore(data.score);
  if (!data.subjectType || !data.subjectId || score === null) {
    const error = new Error('subjectType, subjectId and numeric score (0-100) are required');
    error.statusCode = 400;
    throw error;
  }
  return TrustScore.create({
    subjectType: data.subjectType,
    subjectId: data.subjectId,
    score,
    factors: data.factors,
    calculatedBy: user && user._id
  });
}

async function latestFor(subjectType, subjectId) {
  return TrustScore.findOne({ subjectType, subjectId }).sort({ calculatedAt: -1 }).lean();
}

async function calculateContributorScore(contributorId) {
  const [images, models, predictions, incidents, evidence] = await Promise.all([
    Image.find({ contributor: contributorId }).lean(), AIModel.find({ contributor: contributorId }).lean(), Prediction.find({ contributor: contributorId }).lean(), Incident.find({ contributor: contributorId }).lean(), BlockchainEvidence.find({ entityId: contributorId }).lean()
  ]);
  const ratio = (items, predicate) => items.length ? items.filter(predicate).length / items.length : 1;
  const factors = {
    imageIntegrity: Math.round(ratio(images, item => item.verificationStatus === 'VERIFIED') * 100),
    modelIntegrity: Math.round(ratio(models, item => item.verificationStatus === 'VERIFIED') * 100),
    predictionVerification: Math.round(ratio(predictions, item => item.verificationStatus === 'VERIFIED') * 100),
    blockchainEvidenceStatus: Math.round((evidence.length ? ratio(evidence, item => item.status === 'confirmed') : 0.5) * 100),
    contributorHistory: Math.max(0, 100 - Math.min(incidents.length, 10) * 10),
    pipelineConsistency: Math.max(0, 100 - Math.min(incidents.filter(item => item.type === 'HASH_MISMATCH' || item.type === 'INTEGRITY_FAILURE').length, 10) * 10)
  };
  const score = Math.round(factors.imageIntegrity * 0.25 + factors.modelIntegrity * 0.25 + factors.predictionVerification * 0.2 + factors.blockchainEvidenceStatus * 0.1 + factors.contributorHistory * 0.1 + factors.pipelineConsistency * 0.1);
  return { score, factors };
}

async function saveContributorScore(contributorId) {
  const result = await calculateContributorScore(contributorId);
  return TrustScore.findOneAndUpdate({ subjectType: 'Contributor', subjectId: contributorId }, { score: result.score, factors: result.factors, calculatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

module.exports = { list, get, create, latestFor, calculateContributorScore, saveContributorScore };
