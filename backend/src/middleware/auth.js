'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { isDatabaseConnected } = require('../config/db');
const contributorService = require('../services/contributorService');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const payload = jwt.verify(token, env.jwtSecret);

    if (!isDatabaseConnected()) {
      return res.status(503).json({ success: false, message: 'Database is unavailable' });
    }

    const user = await User.findById(payload.sub).select('-password').lean();
    if (!user || user.isActive === false) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    const contributor = await contributorService.ensureForUser(user);
    req.user = { ...user, contributor: contributor._id };
    req.contributor = contributor;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => (
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ success: false, message: 'Insufficient permissions' })
  );
}

module.exports = { authenticate, authorize };
