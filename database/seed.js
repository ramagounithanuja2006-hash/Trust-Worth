'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const { connectDatabase, disconnectDatabase } = require('../backend/src/config/db');
const User = require('../backend/src/models/User');
const contributorService = require('../backend/src/services/contributorService');
const { ensureIndexes } = require('./indexes');

async function seed() {
  const connected = await connectDatabase();
  if (!connected) {
    throw new Error('MongoDB is unavailable. Set MONGO_URI and start MongoDB before seeding.');
  }

  await ensureIndexes();

  const email = (process.env.SEED_ADMIN_EMAIL || 'analyst@visiontrust.local').toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'VisionTrust Analyst',
      email,
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'analyst',
      organization: 'VisionTrust'
    });
    console.log(`Created seed user ${email}`);
  } else {
    console.log(`Seed user already exists: ${email}`);
  }

  await contributorService.ensureForUser(user);
  await disconnectDatabase();
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { seed };
