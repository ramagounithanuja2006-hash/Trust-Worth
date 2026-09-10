'use strict';

const PipelineEvent = require('../models/PipelineEvent');

async function log(event) {
  return PipelineEvent.create(event);
}

async function record(eventType, data = {}) {
  return log({ ...data, eventType });
}

async function list(query = {}) {
  return PipelineEvent.find(query).sort({ createdAt: -1 }).limit(200).lean();
}

module.exports = { log, record, list };
