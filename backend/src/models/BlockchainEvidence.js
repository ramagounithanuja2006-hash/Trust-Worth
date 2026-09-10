'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  assetId: { type: mongoose.Schema.Types.ObjectId },
  assetType: String,
  hash: { type: String, required: true, index: true },
  eventType: { type: String, required: true, default: 'INTEGRITY' },
  timestamp: { type: Date, default: Date.now },
  contributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
  network: { type: String, default: 'placeholder' },
  transactionId: String,
  transactionHash: String,
  blockNumber: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ entityType: 1, entityId: 1 });
schema.index({ createdAt: -1 });

module.exports = mongoose.model('BlockchainEvidence', schema);
