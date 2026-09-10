'use strict';

const { ethers } = require('ethers');
const env = require('../config/env');
const BlockchainEvidence = require('../models/BlockchainEvidence');
const recordService = require('./recordService');

async function list() {
  return recordService.list(BlockchainEvidence);
}

async function get(id) {
  return recordService.get(BlockchainEvidence, id);
}

async function recordEvidence(data, user) {
  if (!data.entityType || !data.entityId || !data.hash) {
    const error = new Error('entityType, entityId and hash are required');
    error.statusCode = 400;
    throw error;
  }
  return BlockchainEvidence.create({
    entityType: data.entityType,
    entityId: data.entityId,
    hash: data.hash.toLowerCase(),
    assetId: data.assetId || data.entityId,
    assetType: data.assetType || data.entityType,
    eventType: data.eventType || 'INTEGRITY',
    timestamp: data.timestamp || new Date(),
    contributorId: data.contributorId || data.contributor,
    network: data.network || env.blockchainRpcUrl || 'unconfigured',
    transactionId: data.transactionId,
    status: 'pending',
    metadata: data.metadata,
    createdBy: user && user._id
  });
}

async function anchorEvidence(payload, user) {
  const evidence = await recordEvidence(payload, user);
  if (!env.blockchainRpcUrl || !env.blockchainContractAddress || !env.blockchainPrivateKey || !env.blockchainContractAbi) {
    evidence.status = 'failed';
    evidence.metadata = { ...(evidence.metadata || {}), failure: 'Blockchain configuration is incomplete' };
    await evidence.save();
    const error = new Error('Blockchain anchoring is not configured');
    error.statusCode = 503;
    error.evidence = evidence;
    throw error;
  }
  try {
    const abi = JSON.parse(env.blockchainContractAbi);
    const provider = new ethers.JsonRpcProvider(env.blockchainRpcUrl);
    const wallet = new ethers.Wallet(env.blockchainPrivateKey, provider);
    const contract = new ethers.Contract(env.blockchainContractAddress, abi, wallet);
    const transaction = await contract[env.blockchainRecordFunction](
      evidence.assetId.toString(), evidence.assetType, evidence.hash, evidence.eventType,
      Math.floor(evidence.timestamp.getTime() / 1000), evidence.contributorId ? evidence.contributorId.toString() : ''
    );
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1) throw new Error('Blockchain transaction was not successful');
    evidence.status = 'confirmed';
    evidence.transactionId = transaction.hash;
    evidence.transactionHash = transaction.hash;
    evidence.blockNumber = receipt.blockNumber;
    evidence.network = env.blockchainRpcUrl;
    await evidence.save();
    return evidence;
  } catch (cause) {
    evidence.status = 'failed';
    evidence.metadata = { ...(evidence.metadata || {}), failure: cause.message };
    await evidence.save();
    const error = new Error(`Blockchain transaction failed: ${cause.message}`);
    error.statusCode = 502;
    error.code = 'BLOCKCHAIN_TRANSACTION_FAILED';
    error.evidence = evidence;
    throw error;
  }
}

module.exports = { list, get, recordEvidence, anchorEvidence };
