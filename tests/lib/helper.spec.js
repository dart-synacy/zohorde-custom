'use strict';

var expect = require('chai').expect;
var helper = require('../../src/lib/helper');

describe('helper', function () {
  context('toXmlData', function () {
    context('when given single object', function () {
      it('should return valid xml', function () {
        expect(helper.toXmlData('Contact', {
          Id: '1231',
          'First Name': 'x',
          'Last Name': 'y'
        })).equal(
          '<Contact>' +
          '<row no="1">' +
          '<FL val="Id"><![CDATA[1231]]></FL>' +
          '<FL val="First Name"><![CDATA[x]]></FL>' +
          '<FL val="Last Name"><![CDATA[y]]></FL>' +
          '</row>' +
          '</Contact>'
        );
      });
    });

    context('when given array of objects', function () {
      it('should return valid xml', function () {
        expect(helper.toXmlData('Contact', [
          {
            Id: '1231',
            'First Name': 'x',
            'Last Name': 'y'
          },
          {
            Id: '11',
            'First Name': 'a',
            'Last Name': 'b',
            'Pet Name': 'doge'
          }
        ])).equal(
          '<Contact>' +
          '<row no="1">' +
          '<FL val="Id"><![CDATA[1231]]></FL>' +
          '<FL val="First Name"><![CDATA[x]]></FL>' +
          '<FL val="Last Name"><![CDATA[y]]></FL>' +
          '</row>' +
          '<row no="2">' +
          '<FL val="Id"><![CDATA[11]]></FL>' +
          '<FL val="First Name"><![CDATA[a]]></FL>' +
          '<FL val="Last Name"><![CDATA[b]]></FL>' +
          '<FL val="Pet Name"><![CDATA[doge]]></FL>' +
          '</row>' +
          '</Contact>'
        );
      });
    });
  });

  context('flToObject', function () {
    context('when given fl array', function () {
      it('should return valid object', function () {
        expect(helper.flToObject([
          {
            content: '1575656000011371231231',
            val: 'Id'
          },
          {
            content: '2016-09-05 14:08:14',
            val: 'Created Time'
          },
          {
            content: '2016-09-05 14:08:14',
            val: 'Modified Time'
          },
          {
            content: 'Robot',
            val: 'Created By'
          },
          {
            content: 'Robot',
            val: 'Modified By'
          }
        ])).deep.equal({
            Id: '1575656000011371231231',
            'Created Time': '2016-09-05 14:08:14',
            'Modified Time': '2016-09-05 14:08:14',
            'Created By': 'Robot',
            'Modified By': 'Robot'
          });
      });
    });
  });

  context('getSucceededUpdateIds', function () {
    context('when given single update response', function () {
      it('should return the succeeded ids', function () {
        expect(helper.getSucceededUpdateIds({
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
                }
              ]
            },
            'uri': '/crm/private/json/CustomModule1/updateRecords'
          }
        })).deep.equal(['157565600001112312']);
      });
    });

    context('when given multiple update response', function () {
      it('should return the succeeded ids', function () {
        expect(helper.getSucceededUpdateIds({
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
        })).deep.equal(['157565600001112312', '1575656000011312312']);
      });
    });
  });

  context('toOrs', function () {
    it('should return joined or', function () {
      expect(helper.toOrs('Name', [])).equal('()');
      expect(helper.toOrs('Name', ['zz'])).equal('((Name:zz))');
      expect(helper.toOrs('Name', ['A A', 'a', 'Bz'])).equal('((Name:A A) OR (Name:a) OR (Name:Bz))');
    });
  });
});

