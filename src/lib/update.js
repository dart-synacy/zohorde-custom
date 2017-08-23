'use strict';

var BASE_URL_RAW = 'https://crm.zoho.com/crm/private/json/%s/updateRecords';

var _ = require('lodash');
var util = require('util');
var request = require('request');
var Bluebird = require('bluebird');

var helper = require('./helper');

Bluebird.promisifyAll(request);

/**
 * Update 1 record to zoho based on the Id
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/updaterecords.html
 * @param {string} rawParams.id - The data row Id in zoho
 * @param {Object} rawParams.data - Columns to be updated, keys = exact label in CRM module, value = the value
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
    id: rawParams.id,
    xmlData: helper.toXmlData(moduleName, rawParams.data),
    wfTrigger: rawParams.wfTrigger,
    newFormat: rawParams.newFormat,
    larid: rawParams.larid,
    version: '2'
  };

  return request.postAsync(baseUrl, {form: params})
    .then(function maybeParseResponse(httpResponse) {
      if (!rawParams.parseResult) {
        return httpResponse.body;
      }

      var response = JSON.parse(httpResponse.body);
      var succeedObj = _.get(response, 'response.result.recorddetail.FL', null);

      if (succeedObj === null) {
        // Unsuccessful, report it
        return Bluebird.reject(new Error(httpResponse.body));
      }

      return helper.flToObject(succeedObj);
    });
};

/*
Sample response:
{
  "response": {
    "result": {
      "message": "Record(s) updated successfully",
        "recorddetail": {
        "FL": [
          {
            "content": "1575656000011388647",
            "val": "Id"
          },
          {
            "content": "2016-09-05 17:43:13",
            "val": "Created Time"
          },
          {
            "content": "2016-09-05 17:43:13",
            "val": "Modified Time"
          },
          {
            "content": "Cermati Robot",
            "val": "Created By"
          },
          {
            "content": "Cermati Robot",
            "val": "Modified By"
          }
        ]
      }
    },
    "uri": "/crm/private/json/CustomModule1/insertRecords"
  }
}
*/
