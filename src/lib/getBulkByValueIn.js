'use strict';

var GET_RECORD_SIZE = 5; // Max is 5
var MAX_SUCCESSIVE_ERROR = 3;

var _ = require('lodash');
var Bluebird = require('bluebird');

var helper = require('./helper');
var getByCriteria = require('./getByCriteria');

/**
 * Get arbitrarily many records from zoho based on key and values requested
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/searchrecords.html
 * @param {string} rawParams.key - Key to be used for the matching
 * @param {string} rawParams.valueIn - Values to request
 * @param {string} [rawParams.lastModifiedTime] - Time in the format of YYYY-MM-DD HH:mm:SS
 * @param {string} [rawParams.newFormat] - Format to be used, see zoho API page for details
 */
module.exports = function (authToken, moduleName, rawParams) {
  rawParams = rawParams || {};

  var baseParams = {
    authtoken: authToken,
    scope: 'crmapi',
    criteria: undefined, // Filled later
    lastModifiedTime: rawParams.lastModifiedTime,
    newFormat: rawParams.newFormat,
    fromIndex: undefined,
    toIndex: undefined,
    parseResult: true
  };

  var accumulator = [];
  var currentSuccessiveError = 0;
  var taken = 0;
  var key = rawParams.key;
  var valueQueue = rawParams.valueIn || [];

  function getChunk() {
    // Must resolve here, otherwise zoho return random elements
    if (valueQueue.length === 0) {
      return Bluebird.resolve();
    }

    // Pick chunk of first records to be updated
    var params = _.cloneDeep(baseParams);
    var chunkOfValues = _.take(valueQueue, GET_RECORD_SIZE);
    params.criteria = helper.toOrs(key, chunkOfValues);
    params.fromIndex = taken + 1;
    params.toIndex = taken + chunkOfValues.length + 1;

    // Do asynchronous API call
    return getByCriteria(authToken, moduleName, params)
      .then(function (rowObjs) {
        taken += chunkOfValues.length;

        rowObjs.forEach(function (rowObj) {
          accumulator.push(rowObj);
        });

        // Success
        currentSuccessiveError = 0;
        valueQueue = _.drop(valueQueue, GET_RECORD_SIZE);

        // No more data? End
        if (valueQueue.length === 0) {
          return;
        }

        return getChunk();
      })
      .catch(function (err) {
        currentSuccessiveError++;

        // Retry?
        if (currentSuccessiveError <= MAX_SUCCESSIVE_ERROR) {
          return getChunk();
        } else {
          return Bluebird.reject(err);
        }
      });
  }

  return getChunk()
    .then(function () {
      return accumulator;
    });
};
