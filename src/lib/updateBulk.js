'use strict';

var BASE_URL_RAW = 'https://crm.zoho.com/crm/private/json/%s/updateRecords';
var ROWS_PER_API = 100;
var MAX_SUCCESSIVE_ERROR = 3;

var _ = require('lodash');
var util = require('util');
var request = require('request');
var Bluebird = require('bluebird');

var helper = require('./helper');

Bluebird.promisifyAll(request);

/**
 * Update arbitrarily many records to zoho
 * @param {string} authToken
 * @param {string} moduleName
 * @param {Object} rawParams - Key value to be passed in parameters, follow zoho's guide https://www.zoho.com/crm/help/api/updaterecords.html
 * @param {Object[]} rawParams.data - The data rows in js array of objects to be inserted, keys = exact label in CRM module, value = the value
 */
module.exports = function (authToken, moduleName, rawParams) {
  rawParams = rawParams || {};

  var baseUrl = util.format(BASE_URL_RAW, moduleName);

  var baseParams = {
    authtoken: authToken,
    scope: 'crmapi',
    xmlData: undefined, // Filled later
    wfTrigger: rawParams.wfTrigger,
    newFormat: rawParams.newFormat,
    version: '4'
  };

  var data = rawParams.data;
  var currentSuccessiveError = 0;
  var updatedRecordCount = 0;
  var updateQueue = data || [];
  var succeededUpdates = [];

  function updateChunk() {
    // No more?
    if (updateQueue.length === 0) {
      return Bluebird.resolve(succeededUpdates);
    }

    // Pick chunk of first records to be updated
    var params = _.cloneDeep(baseParams);
    params.xmlData = helper.toXmlData(moduleName, _.take(updateQueue, ROWS_PER_API));

    // Do asynchronous API call
    return request.postAsync(baseUrl, {form: params})
      .then(function (httpResponse) {
        // Accumulate succeeded updates to be returned
        var succeededUpdatedIds = helper.getSucceededUpdateIds(JSON.parse(httpResponse.body));
        succeededUpdatedIds.forEach(function accumulate(id) {
          succeededUpdates.push(id);
        });

        // Success
        currentSuccessiveError = 0;
        updatedRecordCount += baseParams.length;

        // Flush the queue and update the next chunk
        updateQueue = _.drop(updateQueue, ROWS_PER_API);
        return updateChunk();
      })
      .catch(function (err) {
        currentSuccessiveError++;

        // Retry?
        if (currentSuccessiveError <= MAX_SUCCESSIVE_ERROR) {
          return updateChunk();
        } else {
          return Bluebird.reject(err);
        }
      });
  }

  return updateChunk();
};

/*
Sample response
{
  'response': {
    'result': {
      'row': [
        {
          'no': '2',
          'success': {
            'code': '2001',
            'details': {
              'FL': [
                {
                  'content': '157565600001112312',
                  'val': 'Id'
                },
                {
                  'content': '2016-09-05 14:17:28',
                  'val': 'Created Time'
                },
                {
                  'content': '2016-09-05 17:57:29',
                  'val': 'Modified Time'
                },
                {
                  'content': 'Robot',
                  'val': 'Created By'
                },
                {
                  'content': 'Robot',
                  'val': 'Modified By'
                }
              ]
            }
          }
        },
        {
          'no': '1',
          'success': {
            'code': '2001',
            'details': {
              'FL': [
                {
                  'content': '1575656000011312312',
                  'val': 'Id'
                },
                {
                  'content': '2016-09-05 14:17:28',
                  'val': 'Created Time'
                },
                {
                  'content': '2016-09-05 17:57:29',
                  'val': 'Modified Time'
                },
                {
                  'content': 'Robot',
                  'val': 'Created By'
                },
                {
                  'content': 'Robot',
                  'val': 'Modified By'
                }
              ]
            }
          }
        }
      ]
    },
    'uri': '/crm/private/json/CustomModule1/updateRecords'
  }
}
*/
