const { Request } = require('express');
const tryParseJSON = require('./tryParseJSON');

/**
 * Adapts and parses the request body to convert query parameters and body parameters into a unified object.
 * @param {Request} req - The Express request object.
 * @returns {Record<string, any>} The adapted and parsed body object.
 */
const adaptParseBody = (req) => {
  const _body = {}
  const { query, body } = req
  for (const key in query) {
    _body[key] = tryParseJSON(query[key])
  }
  for (const key in body) {
    _body[key] = tryParseJSON(body[key])
  }
  return _body
}

module.exports = adaptParseBody
