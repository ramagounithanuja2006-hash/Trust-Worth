'use strict';

async function list(Model, query = {}) {
  return Model.find(query).sort({ createdAt: -1 }).limit(100).lean();
}

async function get(Model, id) {
  return Model.findById(id).lean();
}

async function create(Model, data) {
  return Model.create(data);
}

module.exports = { list, get, create };
