'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  description: String,
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', index: true },
  expectedHash: String,
  actualHash: String,
  impact: mongoose.Schema.Types.Mixed,
  actionTaken: String,
  status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { timestamps: true });

schema.index({ status: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('Incident', schema);
