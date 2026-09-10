const { isDatabaseConnected } = require('../config/db');
const integrity = require('../services/integrityService');
const predictionService = require('../services/predictionService');
const impactService = require('../services/impactService');
const trustService = require('../services/trustService');
const Image = require('../models/Image');
const AIModel = require('../models/AIModel');
const Incident = require('../models/Incident');
const TrustScore = require('../models/TrustScore');

function db(res) { if (!isDatabaseConnected()) { res.status(503).json({ success: false, message: 'Database is unavailable' }); return false; } return true; }
function actor(req) { return req.user && req.user._id; }
async function verify(type, req, res) { if (!db(res)) return; const result = await integrity.verifyStoredAsset(type, req.params.id, actor(req)); res.json({ success: true, data: { asset: result.asset, result: result.verified ? 'VERIFIED' : 'TAMPERED', incident: result.incident || null } }); }
async function createPrediction(req, res) { if (!db(res)) return; res.status(201).json({ success: true, data: await predictionService.create(req.body, req.user) }); }
async function verifyPrediction(req, res) { if (!db(res)) return; const result = await predictionService.verify(req.params.id, req.user); res.json({ success: true, data: { asset: result.asset, result: result.verified ? 'VERIFIED' : 'TAMPERED', incident: result.incident || null } }); }
async function impact(req, res) { if (!db(res)) return; res.json({ success: true, data: await impactService.calculateImpact(req.params.entityType, req.params.id) }); }
async function trust(req, res) { if (!db(res)) return; const score = await trustService.saveContributorScore(req.params.id); res.json({ success: true, data: score }); }
async function incidents(req, res) { if (!db(res)) return; res.json({ success: true, data: await Incident.find({}).sort({ createdAt: -1 }).limit(100).lean() }); }
async function contributorHistory(req, res) { if (!db(res)) return; const id = req.params.id; const [images, models, predictions, incidents, events, score] = await Promise.all([Image.find({ contributor: id }).lean(), AIModel.find({ contributor: id }).lean(), require('../models/Prediction').find({ contributor: id }).lean(), Incident.find({ contributor: id }).lean(), require('../models/PipelineEvent').find({ contributor: id }).sort({ createdAt: -1 }).lean(), TrustScore.findOne({ subjectType: 'Contributor', subjectId: id }).lean()]); res.json({ success: true, data: { contributor: id, images, models, predictions, incidents, events, trustScore: score } }); }
module.exports = { verify, createPrediction, verifyPrediction, impact, trust, incidents, contributorHistory };
