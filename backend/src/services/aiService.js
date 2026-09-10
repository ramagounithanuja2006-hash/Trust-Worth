'use strict';

const axios = require('axios');
const env = require('../config/env');

async function requestInference(payload) {
  if (!env.aiServiceUrl || !env.aiInferenceEnabled) {
    const error = new Error('AI inference service is not enabled');
    error.statusCode = 503;
    throw error;
  }
  try {
    const response = await axios.post(`${env.aiServiceUrl.replace(/\/$/, '')}/infer`, payload, { timeout: 30000 });
    const data = response.data || {};
    const confidence = Number(data.confidence);
    return {
      prediction: data.prediction ?? data.output ?? data.label,
      confidence: Number.isFinite(confidence) ? confidence : undefined,
      predictionHash: data.predictionHash || data.outputSha256,
      inferenceReference: data.inferenceReference || data.requestId,
      raw: data
    };
  } catch (cause) {
    const error = new Error(`AI service request failed: ${cause.response?.data?.message || cause.message}`);
    error.statusCode = cause.response ? 502 : 503;
    error.code = 'AI_SERVICE_UNAVAILABLE';
    throw error;
  }
}

module.exports = { requestInference };
