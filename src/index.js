'use strict';

var _ = require('lodash');

var functions = {
  insert: require('./lib/insert'),
  insertBulk: require('./lib/insertBulk'),
  update: require('./lib/update'),
  updateBulk: require('./lib/updateBulk'),
  getBulkById: require('./lib/getBulkById'),
  getBulkUpdatedAfter: require('./lib/getBulkUpdatedAfter'),
  getBulkByValueIn: require('./lib/getBulkByValueIn'),
  getByCriteria: require('./lib/getByCriteria')
};

/**
 * Construct an object with functions plugged with authToken
 * @param {string} authToken
 * @returns {Object}
 */
module.exports = function (authToken) {
  authToken = authToken || '';

  return _.mapValues(functions, function (f) {
    return f.bind(null, authToken);
  });
};

/**
 * Construct an object with stubbed functions, or noop if not provided.
 * Each function will also be plugged with authToken.
 * Useful for testing (stub zohorde, pass the zohorde object to the function to be tested)
 * @param {string} authToken
 * @param {Object} stubObj - Object with key = function name and value = stub function
 * @returns {Object}
 */
module.exports.asStub = function (authToken, stubObj) {
  authToken = authToken || '';
  stubObj = stubObj || {};

  return _.mapValues(functions, function substituteWithStub(originalFunction, functionName) {
    var stubbedFunction = stubObj[functionName];

    // If not exist, use _.noop
    if (!_.isFunction(stubbedFunction)) {
      return _.noop;
    }

    return stubbedFunction.bind(null, authToken);
  });
};
