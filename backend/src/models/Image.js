'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  originalName: { type: String, required: true },
  storagePath: { type: String, required: true },
  mimeType: String,
  size: Number,
  sha256: { type: String, required: true, index: true },
  expectedSha256: { type: String, required: true },
  actualSha256: String,
  verificationStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED', 'TAMPERED'], default: 'UNVERIFIED' },
  status: { type: String, enum: ['UPLOADED', 'VERIFIED', 'BLOCKED', 'QUARANTINED'], default: 'UPLOADED' },
  quarantineStatus: { type: String, enum: ['NONE', 'QUARANTINED'], default: 'NONE' },
  quarantinedAt: Date,
  blockedReason: String
}, { timestamps: true });

schema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', schema);
