'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true },
  version: { type: String, required: true },
  framework: String,
  originalName: String,
  storagePath: String,
  mimeType: String,
  size: Number,
  sha256: { type: String, required: true, index: true },
  expectedSha256: { type: String, required: true },
  actualSha256: String,
  verificationStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED', 'TAMPERED'], default: 'UNVERIFIED' },
  status: { type: String, enum: ['REGISTERED', 'VERIFIED', 'BLOCKED', 'QUARANTINED'], default: 'REGISTERED' },
  quarantineStatus: { type: String, enum: ['NONE', 'QUARANTINED'], default: 'NONE' },
  quarantinedAt: Date,
  blockedReason: String
}, { timestamps: true });

schema.index({ name: 1, version: 1 });
schema.index({ createdAt: -1 });

module.exports = mongoose.model('AIModel', schema);
