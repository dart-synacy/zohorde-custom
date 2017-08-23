'use strict';

var _ = require('lodash');
var util = require('util');

var self = module.exports;

/**
 * Convert javascript object or array of objects to zoho row + FL form
 * @param moduleName
 * @param {Object|Object[]} data
 * @returns {string}
 */
module.exports.toXmlData = function (moduleName, data) {
  var rows;
  if (!_.isArray(data)) {
    rows = [data];
  } else {
    rows = data;
  }

  var ret = util.format('<%s>', moduleName);
  rows.forEach(function (row, idx) {
    ret += util.format('<row no="%s">', idx + 1);
    _.each(row, function (value, key) {
      if (!_.isUndefined(value) || !_.isNull(value)) {
        ret += util.format('<FL val="%s"><![CDATA[%s]]></FL>', key, value);
      }
    });
    ret += util.format('</row>');
  });
  ret += util.format('</%s>', moduleName);

  return ret;
};

/**
 * Convert zoho's FL form to object
 * @param flArray
 * @returns {Object}
 */
module.exports.flToObject = function (flArray) {
  var obj = {};

  flArray.forEach(function (flItem) {
    obj[flItem.val] = flItem.content;
  });

  return obj;
};

/**
 * Get list of Ids in zoho for each succeeded updates as array of strings
 * @param {Object} updateRecordsResponse
 * @returns {Array}
 */
module.exports.getSucceededUpdateIds = function (updateRecordsResponse) {
  var result = [];
  var rows = _.get(updateRecordsResponse, 'response.result.row', []);

  // Wew, zoho will return single object instead of array if only 1 record is being updated
  if (!_.isArray(rows)) {
    rows = [rows];
  }

  rows.forEach(function addSuccessUpdatesId(row) {
    var flObject = self.flToObject(_.get(row, 'success.details.FL', []));

    if (!_.isUndefined(row.success)) {
      result.push(flObject.Id);
    }
  });

  return result;
};

/**
 * Create "$in" query by joining the values with OR operator
 * @param {string} key - Key to be used
 * @param {Array.<string>} valueIn - Allowed values
 * @returns {string}
 */
module.exports.toOrs = function (key, valueIn) {
  var formatted = _.map(valueIn, function (value) {
    return util.format('(%s:%s)', key, value);
  });
  return '(' + formatted.join(' OR ') + ')';
};
