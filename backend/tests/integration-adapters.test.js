'use strict';

jest.mock('axios', () => ({ post: jest.fn() }));

describe('AI service adapter', () => {
  beforeEach(() => {
    jest.resetModules();
    require('axios').post.mockReset();
    process.env.AI_SERVICE_URL = 'http://ai.test';
    process.env.AI_INFERENCE_ENABLED = 'true';
    process.env.JWT_SECRET = 'integration-test-secret';
  });

  test('normalizes a successful inference response', async () => {
    const axios = require('axios');
    axios.post.mockResolvedValue({ data: { prediction: { label: 'cat' }, confidence: 0.91, requestId: 'req-1' } });
    const service = require('../src/services/aiService');
    await expect(service.requestInference({ imageId: 'image', modelId: 'model' })).resolves.toMatchObject({
      prediction: { label: 'cat' }, confidence: 0.91, inferenceReference: 'req-1'
    });
    expect(axios.post).toHaveBeenCalledWith('http://ai.test/infer', expect.any(Object), expect.objectContaining({ timeout: 30000 }));
  });

  test('reports an unavailable AI service without fabricating output', async () => {
    const axios = require('axios');
    axios.post.mockRejectedValue(new Error('connection refused'));
    const service = require('../src/services/aiService');
    await expect(service.requestInference({})).rejects.toMatchObject({ statusCode: 503, code: 'AI_SERVICE_UNAVAILABLE' });
  });
});

describe('Blockchain adapter', () => {
  test('does not report confirmation when blockchain configuration is incomplete', async () => {
    jest.resetModules();
    process.env.JWT_SECRET = 'integration-test-secret';
    delete process.env.BLOCKCHAIN_RPC_URL;
    delete process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
    delete process.env.BLOCKCHAIN_PRIVATE_KEY;
    delete process.env.BLOCKCHAIN_CONTRACT_ABI;
    jest.doMock('../src/models/BlockchainEvidence', () => ({
      create: jest.fn(async data => ({ ...data, status: 'pending', save: jest.fn(async function save() { return this; }) }))
    }));
    const service = require('../src/services/blockchainService');
    await expect(service.anchorEvidence({ entityType: 'Image', entityId: '507f1f77bcf86cd799439011', hash: 'abc' }))
      .rejects.toMatchObject({ statusCode: 503, message: 'Blockchain anchoring is not configured' });
  });
});

describe('Prediction inference guard', () => {
  test('does not call AI when image integrity fails', async () => {
    jest.resetModules();
    jest.doMock('../src/models/Image', () => ({ findById: jest.fn(async () => ({ _id: 'image', storagePath: 'image', sha256: 'image-hash' })) }));
    jest.doMock('../src/models/AIModel', () => ({ findById: jest.fn(async () => ({ _id: 'model', storagePath: 'model', sha256: 'model-hash' })) }));
    jest.doMock('../src/services/integrityService', () => ({ verifyStoredAsset: jest.fn(async () => ({ verified: false })) }));
    const aiService = require('../src/services/aiService');
    jest.spyOn(aiService, 'requestInference').mockResolvedValue({ prediction: 'should-not-run' });
    const predictionService = require('../src/services/predictionService');
    await expect(predictionService.infer({ image: 'image', aiModel: 'model' }, { _id: 'user' }))
      .rejects.toMatchObject({ statusCode: 423 });
    expect(aiService.requestInference).not.toHaveBeenCalled();
  });
});
