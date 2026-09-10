const mongoose = require('mongoose');
const env = require('./env');

let connected = false;

async function connectDatabase() {
  if (!env.mongoUri) {
    if (env.mongoRequired) throw new Error('MONGO_URI is required');
    return false;
  }
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    return true;
  } catch (error) {
    connected = false;
    if (env.mongoRequired) throw error;
    console.warn(`MongoDB unavailable; continuing without persistence: ${error.message}`);
    return false;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  connected = false;
}

function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, disconnectDatabase, isDatabaseConnected };
