'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const contributorService = require('./contributorService');

function tokenFor(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function toSafeUser(user) {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return safeUser;
}

async function register(data) {
  const { name, email, password, role, organization } = data;
  const safeRole = role === 'admin' ? 'contributor' : (role || 'contributor');
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role: safeRole, organization });
  const contributor = await contributorService.ensureForUser(user);
  const safeUser = toSafeUser(user);
  return { user: safeUser, contributor, token: tokenFor(user) };
}

async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  const valid = await user.comparePassword(password);
  if (!valid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  const contributor = await contributorService.ensureForUser(user);
  return { user: toSafeUser(user), contributor, token: tokenFor(user) };
}

module.exports = { register, login, tokenFor };
