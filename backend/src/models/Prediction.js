'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true, index: true },
  aiModel: { type: mongoose.Schema.Types.ObjectId, ref: 'AIModel', required: true, index: true },
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageHash: String,
  modelHash: String,
  output: mongoose.Schema.Types.Mixed,
  prediction: mongoose.Schema.Types.Mixed,
  confidence: Number,
  expectedOutputSha256: String,
  outputSha256: String,
  verificationStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED', 'TAMPERED'], default: 'UNVERIFIED' },
  status: { type: String, enum: ['QUEUED', 'COMPLETED', 'FAILED', 'BLOCKED'], default: 'QUEUED' },
  quarantineStatus: { type: String, enum: ['NONE', 'QUARANTINED'], default: 'NONE' },
  inferenceReference: String,
  blockchainEvidence: { type: mongoose.Schema.Types.ObjectId, ref: 'BlockchainEvidence' },
  blockedReason: String
}, { timestamps: true });

schema.index({ createdAt: -1 });

module.exports = mongoose.model('Prediction', schema);
