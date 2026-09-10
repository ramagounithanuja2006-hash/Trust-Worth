'use strict';

const authService = require('../services/authService');
const { isDatabaseConnected } = require('../config/db');

function requireDatabase(res) {
  if (!isDatabaseConnected()) {
    res.status(503).json({ success: false, message: 'Database is unavailable' });
    return false;
  }
  return true;
}

async function register(req, res) {
  if (!requireDatabase(res)) return;
  const { name, email, password, organization, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  const result = await authService.register({
    name,
    email,
    password,
    organization,
    role: role === 'admin' ? 'contributor' : role
  });
  res.status(201).json({ success: true, data: result });
}

async function login(req, res) {
  if (!requireDatabase(res)) return;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }
  res.json({ success: true, data: await authService.login(email, password) });
}

function me(req, res) {
  res.json({ success: true, data: req.user });
}

module.exports = { register, login, me };
