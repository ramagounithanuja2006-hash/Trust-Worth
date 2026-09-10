'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  organization: { type: String, trim: true },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  publicKey: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

schema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Contributor', schema);
