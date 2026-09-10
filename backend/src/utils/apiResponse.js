'use strict';

/**
 * Uniform API response helpers.
 */

function success(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function created(res, data = {}, message = 'Created') {
  return success(res, data, message, 201);
}

function paginated(res, items, total, page, limit, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  });
}

function error(res, message = 'Error', statusCode = 400, details = null) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

module.exports = { success, created, paginated, error };
