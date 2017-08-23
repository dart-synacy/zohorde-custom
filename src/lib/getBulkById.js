/*
Sample response from single API zoho getRecordById
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
    "uri": "/crm/private/json/CustomModule1/getRecordById"
  }
}
*/

'use strict';

var BASE_URL_RAW = 'https://crm.zoho.com/crm/private/json/%s/getRecordById';
var GET_RECORD_SIZE = 100; // Max is 100
var MAX_SUCCESSIVE_ERROR = 3;

var _ = require('lodash');
var util = require('util');
var request = require('request');
var Bluebird = require('bluebird');

var helper = require('./helper');

Bluebird.promisifyAll(request);

/**
 * Get arbitrarily many records from zoho based on ids
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/updaterecords.html
 * @param {Array} rawParams.data - Array of strings, the id to fetch
 */
module.exports = function (authToken, moduleName, rawParams) {
  rawParams = rawParams || {};

  var baseUrl = util.format(BASE_URL_RAW, moduleName);

  var baseParams = {
    authtoken: authToken,
    scope: 'crmapi',
    idlist: undefined, // Filled later
    newFormat: rawParams.newFormat,
    version: '2'
  };

  var accumulator = [];
  var currentSuccessiveError = 0;
  var idQueue = rawParams.data || [];

  function getChunk() {
    // Pick chunk of first records to be updated
    var params = _.cloneDeep(baseParams);
    var chunkOfIds = _.take(idQueue, GET_RECORD_SIZE);
    params.idlist = chunkOfIds.join(';');

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
        idQueue = _.drop(idQueue, GET_RECORD_SIZE);

        // No more data? End
        if (idQueue.length === 0) {
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
