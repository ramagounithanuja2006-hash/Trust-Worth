'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['UPLOAD', 'HASH_CREATED', 'VERIFICATION', 'INFERENCE', 'PREDICTION', 'BLOCK', 'QUARANTINE', 'INCIDENT', 'IMPACT_ANALYSIS'],
    required: true
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  payload: mongoose.Schema.Types.Mixed,
  sha256: String
}, { timestamps: true });

schema.index({ eventType: 1, createdAt: -1 });
schema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('PipelineEvent', schema);
