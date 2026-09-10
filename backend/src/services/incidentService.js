'use strict';

const Incident = require('../models/Incident');
const recordService = require('./recordService');
const pipelineEventService = require('./pipelineEventService');
const impactService = require('./impactService');

async function list(query = {}) {
  return recordService.list(Incident, query);
}

async function get(id) {
  return recordService.get(Incident, id);
}

async function create(data) {
  if (!data.type || !data.entityType || !data.entityId) {
    const error = new Error('type, entityType and entityId are required');
    error.statusCode = 400;
    throw error;
  }
  const impact = data.impact || await impactService.calculateImpact(data.entityType, data.entityId);
  const incident = await Incident.create({ ...data, impact });
  await pipelineEventService.log({
    eventType: 'INCIDENT',
    actor: data.reportedBy,
    contributor: data.contributor,
    entityType: data.entityType,
    entityId: data.entityId,
    payload: { type: data.type, severity: data.severity || 'medium', impact: impact.counts }
  });
  return incident;
}

module.exports = { list, get, create };
