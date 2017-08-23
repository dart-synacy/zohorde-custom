/*
Sample raw response (result trimmed to keep it short)
{
  "response": {
    "result": {
      "CustomModule1": {
        "row": [
          {
            "no": "1",
            "FL": [
              {
                "val": "CUSTOMMODULE1_ID",
                "content": "1575656000014712312"
              },
              {
                "val": "Application Name",
                "content": "Product 1"
              },
              {
                "val": "SMOWNERID",
                "content": "1575651231231758341"
              }
            ]
          },
          {
            "no": "2",
            "FL": [
              {
                "val": "CUSTOMMODULE1_ID",
                "content": "157565600123127969"
              },
              {
                "val": "Application Name",
                "content": "Product 2"
              },
              {
                "val": "SMOWNERID",
                "content": "15756560001231241"
              },
              {
                "val": "CustomModule1 Owner",
                "content": "Robot"
              }
            ]
          },
          {
            "no": "3",
            "FL": [
              {
                "val": "CUSTOMMODULE1_ID",
                "content": "1575656000014791207"
              },
              {
                "val": "Application Name",
                "content": "Product 3"
              }
            ]
          }
        ]
      }
    },
    "uri": "/crm/private/json/CustomModule1/searchRecords"
  }
}
 */

'use strict';

var BASE_URL_RAW = 'https://crm.zoho.com/crm/private/json/%s/searchRecords';
var NO_DATA_ERROR_CODE = 4422;

var _ = require('lodash');
var util = require('util');
var request = require('request');
var Bluebird = require('bluebird');

var helper = require('./helper');

Bluebird.promisifyAll(request);

/**
 * Get up to 200 first search result by criteria
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/searchrecords.html
 * @param {string} rawParams.criteria - The criteria based on zoho's guide
 * @param {string} [rawParams.lastModifiedTime] - Time in the format of YYYY-MM-DD HH:mm:SS
 * @param {string} [rawParams.newFormat] - Format to be used, see zoho API page for details
 */
module.exports = function (authToken, moduleName, rawParams) {
  rawParams = rawParams || {};
  _.defaults(rawParams, {
    parseResult: true
  });

  var baseUrl = util.format(BASE_URL_RAW, moduleName);

  var params = {
    authtoken: authToken,
    scope: 'crmapi',
    criteria: rawParams.criteria,
    lastModifiedTime: rawParams.lastModifiedTime,
    newFormat: rawParams.newFormat,
    fromIndex: 1,
    toIndex: 200
  };

  return request.postAsync(baseUrl, {form: params})
    .then(function maybeParseResponse(httpResponse) {
      if (!rawParams.parseResult) {
        return httpResponse.body;
      }

      var response = JSON.parse(httpResponse.body);

      var succeedObjs = _.get(response, ['response', 'result', moduleName, 'row'], null);
      if (succeedObjs === null) {
        // Unsuccessful, report it
        return Bluebird.reject(new Error(httpResponse.body));
      }

      if (!_.isArray(succeedObjs)) {
        succeedObjs = [succeedObjs];
      }

      return _.map(succeedObjs, function (succeedObj) {
        return helper.flToObject(succeedObj.FL);
      });
    })
    .catch(function (err) {
      var message = _.get(err, 'message');
      var errorObj;
      try {
        errorObj = JSON.parse(message);
      } catch (e) {
      }

      if (Number(_.get(errorObj, 'response.nodata.code')) === NO_DATA_ERROR_CODE) {
        // No search result found, return empty array and don't throw error
        return [];
      }

      // If we reach here, it means it is really an error, keep throwing error
      return Bluebird.reject(err);
    });
};
