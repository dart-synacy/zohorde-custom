'use strict';

var BASE_URL_RAW = 'https://crm.zoho.com/crm/private/json/%s/insertRecords';
var ROWS_PER_API = 100; // 100 is max
var MAX_SUCCESSIVE_ERROR = 3;

/*
 Sample response from zoho insertRecords
{
  "response": {
  "result": {
    "row": [
      {
        "no": "1",
        "success": {
          "details": {
            "FL": [
              {
                "content": "157565600001112312",
                "val": "Id"
              },
              {
                "content": "2016-10-03 14:23:21",
                "val": "Created Time"
              },
              {
                "content": "2016-10-03 14:23:21",
                "val": "Modified Time"
              },
              {
                "content": "Robot",
                "val": "Created By"
              },
              {
                "content": "Robot",
                "val": "Modified By"
              }
            ]
          },
          "code": "2000"
        }
      },
      {
        "error": {
          "details": "Duplicate record(s) with same Order ID already exists.",
          "code": "4819"
        },
        "no": "2"
      }
    ]
  },
  "uri": "/crm/private/json/CustomModule1/insertRecords"
}
*/

var _ = require('lodash');
var util = require('util');
var request = require('request');
var Bluebird = require('bluebird');

var helper = require('./helper');

Bluebird.promisifyAll(request);

/**
 * Insert records to zoho
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/insertrecords.html
 * @param {Object} rawParams.data - The data row in js object to be inserted, keys = exact label in CRM module, value = the value
 */
module.exports = function (authToken, moduleName, rawParams) {
  rawParams = rawParams || {};

  var baseUrl = util.format(BASE_URL_RAW, moduleName);

  var baseParams = {
    authtoken: authToken,
    scope: 'crmapi',
    xmlData: undefined, // Filled later
    duplicateCheck: rawParams.duplicateCheck,
    isApproval: rawParams.isApproval,
    newFormat: rawParams.newFormat,
    version: '4'
  };

  var processedCount = 0;
  var currentSuccessiveError = 0;
  var insertQueue = rawParams.data || [];
  var insertionResult = [];

  function insertChunk() {
    // No more?
    if (insertQueue.length === 0) {
      return Bluebird.resolve(insertionResult);
    }

    // Pick chunk of first records to be updated
    var params = _.cloneDeep(baseParams);
    params.xmlData = helper.toXmlData(moduleName, _.take(insertQueue, ROWS_PER_API));

    // Do asynchronous API call
    return request.postAsync(baseUrl, {form: params})
      .then(function (httpResponse) {
        // Store the result for each row
        var response = JSON.parse(httpResponse.body);
        var rows = _.get(response, 'response.result.row');

        if (rows === null) {
          // Throw error so it will be caught and retry request
          throw new Error('Null rows received, expected rows describing success/failure for each record');
        }

        // Wew, zoho will return single object instead of array if only 1 record is being updated
        if (!_.isArray(rows)) {
          rows = [rows];
        }

        // Sort by the order we gave to zoho
        rows = _.sortBy(rows, function (row) {
          return Number(row.no);
        });

        // Accumulate the response
        rows.forEach(function (row) {
          var result;
          if (_.has(row, 'success')) {
            result = {
              data: helper.flToObject(_.get(row, 'success.details.FL', {})),
              message: null,
              code: _.get(row, 'success.code')
            };
          } else if (_.has(row, 'error')) {
            result = {
              data: null,
              message: _.get(row, 'error.details'),
              code: _.get(row, 'error.code')
            };
          } else {
            result = {
              data: null,
              message: null,
              code: null
            };
          }

          insertionResult.push(result);
        });

        // Success
        currentSuccessiveError = 0;
        processedCount += baseParams.length;

        // Flush the queue and update the next chunk
        insertQueue = _.drop(insertQueue, ROWS_PER_API);
        return insertChunk();
      })
      .catch(function (err) {
        currentSuccessiveError++;

        // Retry?
        if (currentSuccessiveError <= MAX_SUCCESSIVE_ERROR) {
          return insertChunk();
        } else {
          return Bluebird.reject(err);
        }
      });
  }

  return insertChunk();
};
