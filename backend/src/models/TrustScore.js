'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  subjectType: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  factors: mongoose.Schema.Types.Mixed,
  calculatedAt: { type: Date, default: Date.now },
  calculatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ subjectType: 1, subjectId: 1, calculatedAt: -1 });

module.exports = mongoose.model('TrustScore', schema);
