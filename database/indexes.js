'use strict';

const User = require('../backend/src/models/User');
const Contributor = require('../backend/src/models/Contributor');
const Image = require('../backend/src/models/Image');
const AIModel = require('../backend/src/models/AIModel');
const Prediction = require('../backend/src/models/Prediction');
const PipelineEvent = require('../backend/src/models/PipelineEvent');
const BlockchainEvidence = require('../backend/src/models/BlockchainEvidence');
const TrustScore = require('../backend/src/models/TrustScore');
const Incident = require('../backend/src/models/Incident');

async function ensureIndexes() {
  await Promise.all([
    User.syncIndexes(),
    Contributor.syncIndexes(),
    Image.syncIndexes(),
    AIModel.syncIndexes(),
    Prediction.syncIndexes(),
    PipelineEvent.syncIndexes(),
    BlockchainEvidence.syncIndexes(),
    TrustScore.syncIndexes(),
    Incident.syncIndexes()
  ]);
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
  const { connectDatabase, disconnectDatabase } = require('../backend/src/config/db');
  connectDatabase()
    .then(async (connected) => {
      if (!connected) throw new Error('MongoDB is unavailable');
      await ensureIndexes();
      console.log('Indexes synchronized');
      await disconnectDatabase();
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { ensureIndexes };
