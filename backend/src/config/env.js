const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  mongoRequired: process.env.MONGO_REQUIRED === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 25),
  aiServiceUrl: process.env.AI_SERVICE_URL,
  aiInferenceEnabled: process.env.AI_INFERENCE_ENABLED === 'true',
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL,
  blockchainContractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
  blockchainPrivateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
  blockchainContractAbi: process.env.BLOCKCHAIN_CONTRACT_ABI,
  blockchainRecordFunction: process.env.BLOCKCHAIN_RECORD_FUNCTION || 'recordEvidence',
  blockchainServiceUrl: process.env.BLOCKCHAIN_SERVICE_URL
};

if (!env.jwtSecret) throw new Error('JWT_SECRET is required');
if (env.nodeEnv === 'production' && env.jwtSecret.includes('change-me')) {
  throw new Error('A unique JWT_SECRET is required in production');
}

module.exports = env;
