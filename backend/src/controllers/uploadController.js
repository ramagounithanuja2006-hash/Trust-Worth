'use strict';

const imageController = require('./imageController');
const modelController = require('./modelController');

async function image(req, res) {
  return imageController.upload(req, res);
}

async function model(req, res) {
  return modelController.upload(req, res);
}

module.exports = { image, model };
