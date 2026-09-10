'use strict';

const Contributor = require('../models/Contributor');
const recordService = require('./recordService');

async function ensureForUser(user) {
  const userId = user._id || user.id;
  let contributor = await Contributor.findOne({ user: userId });
  if (contributor) return contributor;
  contributor = await Contributor.create({
    user: userId,
    organization: user.organization
  });
  return contributor;
}

async function list(query = {}) {
  return recordService.list(Contributor, query);
}

async function get(id) {
  return Contributor.findById(id).populate('user', 'name email role organization').lean();
}

async function create(data, actor) {
  if (!data.user && actor) data.user = actor._id;
  if (!data.user) {
    const error = new Error('user is required');
    error.statusCode = 400;
    throw error;
  }
  return recordService.create(Contributor, data);
}

module.exports = { ensureForUser, list, get, create };
