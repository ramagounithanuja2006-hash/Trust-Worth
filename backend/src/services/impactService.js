'use strict';

const Incident = require('../models/Incident');
const Image = require('../models/Image');
const AIModel = require('../models/AIModel');
const Prediction = require('../models/Prediction');
const pipelineEventService = require('./pipelineEventService');

async function calculateImpact(entityType, entityId) {
  const impact = { images: [], models: [], predictions: [], contributors: [], pipelineEvents: [] };
  if (entityType === 'AIModel') {
    impact.models = await AIModel.find({ _id: entityId }).lean();
    impact.predictions = await Prediction.find({ aiModel: entityId }).lean();
    impact.images = await Image.find({ _id: { $in: impact.predictions.map(item => item.image) } }).lean();
  } else if (entityType === 'Image') {
    impact.images = await Image.find({ _id: entityId }).lean();
    impact.predictions = await Prediction.find({ image: entityId }).lean();
    impact.models = await AIModel.find({ _id: { $in: impact.predictions.map(item => item.aiModel) } }).lean();
  } else if (entityType === 'Prediction') {
    const prediction = await Prediction.findById(entityId).lean();
    if (prediction) {
      impact.predictions = [prediction];
      impact.images = await Image.find({ _id: prediction.image }).lean();
      impact.models = await AIModel.find({ _id: prediction.aiModel }).lean();
    }
  }
  impact.contributors = [...new Set([...impact.images, ...impact.models, ...impact.predictions].map(item => item.contributor).filter(Boolean).map(id => id.toString()))];
  const ids = [entityId, ...impact.images.map(item => item._id), ...impact.models.map(item => item._id), ...impact.predictions.map(item => item._id)];
  impact.pipelineEvents = await pipelineEventService.list({ entityId: { $in: ids } });
  impact.counts = { images: impact.images.length, models: impact.models.length, predictions: impact.predictions.length, contributors: impact.contributors.length, pipelineEvents: impact.pipelineEvents.length };
  return impact;
}

async function summary() {
  const [openIncidents, images, models, predictions, events] = await Promise.all([
    Incident.countDocuments({ status: { $ne: 'resolved' } }),
    Image.countDocuments(),
    AIModel.countDocuments(),
    Prediction.countDocuments(),
    pipelineEventService.list()
  ]);

  const tamperedImages = await Image.countDocuments({ verificationStatus: 'TAMPERED' });
  const tamperedModels = await AIModel.countDocuments({ verificationStatus: 'TAMPERED' });

  return {
    status: 'available',
    message: 'Impact analytics interface is ready',
    totals: {
      images,
      models,
      predictions,
      openIncidents,
      tamperedImages,
      tamperedModels,
      recentEvents: events.length
    }
  };
}

module.exports = { summary, calculateImpact };
