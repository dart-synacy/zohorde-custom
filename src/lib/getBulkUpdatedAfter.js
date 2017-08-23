/*
Sample response from single API zoho getRecords
{
  "response": {
    "result": {
      "CustomModule1": {
        "row": [
          {
            "no": "1",
            "FL": [
              {
                "content": "1575656000008260351",
                "val": "CUSTOMMODULE1_ID"
              },
              {
                "content": "Maybank KTA Payroll",
                "val": "Application Name"
              },
              {
                "content": "1575656000001758341",
                "val": "SMOWNERID"
              }
            ]
          },
          {
            "no": "2",
            "FL": [
              {
                "content": "1575656000008260339",
                "val": "CUSTOMMODULE1_ID"
              },
              {
                "content": "Tunaiku Bank Amar",
                "val": "Application Name"
              },
              {
                "content": "1575656000001758341",
                "val": "SMOWNERID"
              }
            ]
          },
          {
            "no": "3",
            "FL": [
              {
                "content": "1575656000008260319",
                "val": "CUSTOMMODULE1_ID"
              },
              {
                "content": "Dana Bantuan Sahabat",
                "val": "Application Name"
              },
              {
                "content": "1575656000001758341",
                "val": "SMOWNERID"
              }
            ]
          }
        ]
      }
    },
    "uri": "/crm/private/json/CustomModule1/getRecords"
  }
}
*/

'use strict';

var BASE_URL_RAW = 'https://crm.zoho.com/crm/private/json/%s/getRecords';
var GET_RECORD_SIZE = 200; // Max is 200
var MAX_SUCCESSIVE_ERROR = 3;

var _ = require('lodash');
var util = require('util');
var request = require('request');
var Bluebird = require('bluebird');

var helper = require('./helper');

Bluebird.promisifyAll(request);

/**
 * Get arbitrarily many records from zoho based on modifiedAfter
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/updaterecords.html
 * @param {string} rawParams.lastModifiedTime - Time in the format of YYYY-MM-DD HH:mm:SS
 * @param {string} [rawParams.newFormat] - Format to be used, see zoho API page for details
 * @param {number} [rawParams.limit] - Stop fetching if the number of records fetched reached this limit.
 *   Limit is ignored as long as the record 'Modified Time' fetched is still the same as requested lastModifiedTime.
 * @param {Object|Array} rawParams.selectColumns - List of labels to fetch, following mongodb's select format. Leave it undefined for all columns
 */
module.exports = function (authToken, moduleName, rawParams) {
  rawParams = rawParams || {};
  _.defaults(rawParams, {
    limit: Number.MAX_VALUE
  });

  var baseUrl = util.format(BASE_URL_RAW, moduleName);

  var baseParams = {
    authtoken: authToken,
    scope: 'crmapi',
    selectColumns: _.isArray(rawParams.selectColumns) ? util.format('%s(%s)', moduleName, rawParams.selectColumns.join(',')) : undefined,
    fromIndex: undefined, // Filled later
    toIndex: undefined, // Filled later
    lastModifiedTime: rawParams.lastModifiedTime,
    sortColumnString: 'Modified Time',
    sortOrderString: 'asc',
    newFormat: rawParams.newFormat,
    version: '2'
  };

  var accumulator = [];
  var currentSuccessiveError = 0;

  function getChunk() {
    // Pick chunk of first records to be updated
    var params = _.cloneDeep(baseParams);
    params.fromIndex = accumulator.length + 1;
    params.toIndex = accumulator.length + GET_RECORD_SIZE;

    // Do asynchronous API call
    return request.postAsync(baseUrl, {form: params})
      .then(function (httpResponse) {
        var responseBody = JSON.parse(httpResponse.body);

        // Accumulate result
        var rows = _.get(responseBody, 'response.result.' + moduleName + '.row', []);

        // If only 1 element returned, zoho returned it as object
        if (!_.isArray(rows)) {
          rows = [rows];
        }

        rows.forEach(function (row) {
          var rowObj = helper.flToObject(row.FL);
          accumulator.push(rowObj);
        });

        // Success
        currentSuccessiveError = 0;

        // No more data? End
        if (rows.length < GET_RECORD_SIZE) {
          return;
        }

        // Reached limit? End
        var lastModifiedTimeFetched = _.last(accumulator)['Modified Time'];
        if ((accumulator.length > rawParams.limit) && (lastModifiedTimeFetched !== rawParams.lastModifiedTime)) {
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
