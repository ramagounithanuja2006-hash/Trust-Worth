'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { health } = require('./controllers/healthController');
require('./config/paths');

const app = express();
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((value) => value.trim()),
  credentials: true
}));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

app.get('/health', health);
app.get('/api/health', health);
app.get('/', (req, res) => res.json({
  success: true,
  service: 'visiontrust-backend',
  health: '/api/health',
  api: '/api'
}));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/images', require('./routes/images'));
app.use('/api/models', require('./routes/models'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/contributors', require('./routes/contributors'));
app.use('/api/trust', require('./routes/trust'));
app.use('/api/impact', require('./routes/impact'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/integrity', require('./routes/integrity'));
app.use('/api/pipeline-events', require('./routes/pipeline'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
