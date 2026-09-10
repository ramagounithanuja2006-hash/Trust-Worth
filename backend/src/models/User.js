'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin', 'contributor', 'analyst', 'viewer'], default: 'contributor' },
  organization: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

schema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

schema.methods.comparePassword = function comparePassword(value) {
  return bcrypt.compare(value, this.password);
};

module.exports = mongoose.model('User', schema);
