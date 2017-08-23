# ZOHORDE

Node module to connect your application to zoho CRM API, specifically built for bulk operations.

# Initialization

```js
var ZOHO_CRM_AUTH_KEY = '99e00de081d1cd9a38e467fee6ab684e'
var zohorde = require('zohorde')(ZOHO_CRM_AUTH_KEY)
```

Now you can call the APIs.

# API

All APIs: 

  * are asynchronous and using promise (specifically, Bluebird promise).
  * if contain the word "bulk", the request data will be split to chunks and submitted sequentially.
  * may return promise rejection.
    * For insert/update single record, rejects on failed insertion/update and network error.
    * For bulk operation, rejects on network error after several retries.

Disclaimer: following documentation contains copies from https://www.zoho.com/crm/help/api

## [insert](https://www.zoho.com/crm/help/api/insertrecords.html)

Response version 2 is used.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  data: {
    'First Name': 'Joko',
    'Last Name': 'Susilo',
    Email: 'joko@susilo.com'
  }
};

zohorde.insert(moduleName, params);
```

Params:

  * parseResult: Boolean. In case of failed insertion, determine if you want to parse the response body. Defaults to true.
  * data: Object representing your record, with key = field name in zoho and value = desired value.
  * wfTrigger: Boolean, determining to trigger workflow after insertion or not.
  * duplicateCheck: Set value as "1" to check the duplicate records and throw an error response or "2" to check the duplicate records, if exists, update the same.
  * isApproval: By default, records are inserted directly . To keep the records in approval mode, set value as true. You can use this parameters for Leads, Contacts, and Cases module.
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values while inserting data from your CRM account. 
    * newFormat=2: To include fields with "null" values while inserting data from your CRM account.

Returns:
 
  * On failed, return zoho's API response. If you set parseResult to false, the raw string will be returned. Otherwise, it will be parsed and returned as javascript object.
  * On success, return record detail from zoho (you can find it in respose.result.recorddetail) in javascript object.

Example:

```js
{
  Id: '12312412312315',
  'Created Time': '2016-09-05 17:43:13',
  'Modified Time': '2016-09-05 17:43:13',
  'Created By': 'CS Account',
  'Modified By': 'CS Account'
}
```

## [insertBulk](https://www.zoho.com/crm/help/api/insertrecords.html)

Response version 4 is used.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  data: [
    {
      'First Name': 'Joko',
      'Last Name': 'Susilo',
      Email: 'joko@susilo.com'
    },
    {
      'First Name': 'Suparman',
      'Last Name': 'Prasetya',
      Email: 'tampan@sekali.com'
    }    
  ]
};

zohorde.insertBulk(moduleName, params);
```

Params:

  * data: Array of objects representing your record, with key = field name in zoho and value = desired value.
  * duplicateCheck: Set value as "1" to check the duplicate records and throw an error response or "2" to check the duplicate records, if exists, update the same.
  * isApproval: By default, records are inserted directly . To keep the records in approval mode, set value as true. You can use this parameters for Leads, Contacts, and Cases module.
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values while inserting data from your CRM account. 
    * newFormat=2: To include fields with "null" values while inserting data from your CRM account.

Returns:
 
  * Array of objects, for each objects in your params.data, order preserved:
  
```
{
  data: { // null if insertion failed
    Id: <zoho record ID>,
    'Created Time': ...,
    'Modified Time': ...,
    'Created By': ...,
    'Modified By': ...
  }
  message: <zoho message> // null if record successfully inserted/no response from zoho
  code: <zoho status code> // null if no response from zoho
}
```

Example:

```js
[
  {
    data: {
      Id: '12312412312315',
      'Created Time': '2016-09-05 17:43:13',
      'Modified Time': '2016-09-05 17:43:13',
      'Created By': 'CS Account',
      'Modified By': 'CS Account'
    },
    message: null,
    code: '2000'
  },
  {
    data: null,
    message: 'Duplicate record found!',
    code: '4012'
  }
]
```

Note:

  * Can insert arbitrarily many records, even though zoho limit us by 100 records per insertion. This library will split it to chunks of 100 records, and insert sequentially.
  * Can't use workflow when inserting multiple records.
  * May take a long time depending on how many records to insert.

## [update](https://www.zoho.com/crm/help/api/updaterecords.html)

Response version 2 is used.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  id: '3124124131',
  data: {
    Email: 'joko@susilo.com',
    Phone: '08181818181'
  }
};

zohorde.update(moduleName, params);
```

Params:

  * parseResult: Boolean. In case of failed insertion, determine if you want to parse the response body. Defaults to true.
  * id: String representing zoho record id for the record to be updated.
  * data: Object representing your record, with key = field name in zoho and value = desired value.
  * wfTrigger: Boolean, determining to trigger workflow after insertion or not.
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values while inserting data from your CRM account. 
    * newFormat=2: To include fields with "null" values while inserting data from your CRM account.

Returns:
 
  * On failed, return zoho's API response. If you set parseResult to false, the raw string will be returned. Otherwise, it will be parsed and returned as javascript object.
  * On success, return record detail from zoho (you can find it in respose.result.recorddetail) in javascript object.

Example:

```js
{
  Id: '12312412312315',
  'Created Time': '2016-09-05 17:43:13',
  'Modified Time': '2016-09-05 17:43:13',
  'Created By': 'CS Account',
  'Modified By': 'CS Account'
}
```

## [updateBulk](https://www.zoho.com/crm/help/api/updaterecords.html)

Response version 4 is used.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  data: [
    {
      Id: '12312412312315',
      Email: 'joko@susilo.com',
      Phone: '08181818181'
    },
    {
      Id: '12312412312318',
      'Postal Code': '11445'
    },
    {
      Id: '9999999999999',
      'Postal Code': 'zzz'
    }    
  ]
};

zohorde.updateBulk(moduleName, params);
```

Params:

  * data: Array of objects representing your record, with key = field name in zoho and value = desired value.
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values while inserting data from your CRM account. 
    * newFormat=2: To include fields with "null" values while inserting data from your CRM account.

Returns:
 
  * Array of strings, representing zoho record ids for each rows successfully updated.

Example:

```js
['12312412312315', '12312412312318']
```

Note:

  * Can update arbitrarily many records, even though zoho limit us by 100 records per update. This library will split it to chunks of 100 records, and update sequentially.
  * Can't use workflow when updating multiple records.
  * May take a long time depending on how many records to update.

## [getBulkById](https://www.zoho.com/crm/help/api/getrecords.html)

Response version 2 is used.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  data: ['12312412312315', '12312412312318', '129199191910']
};

zohorde.getBulkById(moduleName, params);
```

Params:

  * data: Array of strings representing zoho record ids to be fetched.
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values. 
    * newFormat=2: To include fields with "null" values.

Returns:
 
  * Array of objects, representing zoho records you requested. If not found, will not present in the result.

Example:

```
[
  {
    CONTACT_ID: '12312412312315',
    'First Name': 'Joko',
    'Last Name': 'Susilo',
    'Email': ...,
    ...
  },
  {
    CONTACT_ID: '12312412312318',
    'First Name': 'Suparman',
    'Last Name': 'Prasetya',
    'Email': ...,
    ...
  }
]
```

Note:

  * Can get arbitrarily many records, even though zoho limit us by 100 records. This library will split it to chunks of 100 records, and fetch sequentially.
  * May take a long time depending on how many records to fetch.

## [getBulkUpdatedAfter](https://www.zoho.com/crm/help/api/getrecords.html)

Response version 2 is used.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  lastModifiedTime: '2016-10-15 17:10:21'
};

zohorde.getBulkUpdatedAfter(moduleName, params);
```
Params:

  * lastModifiedTime: String in format 'YYYY-MM-DD HH:mm:ss'
  * selectColumns: Array of strings representing the fields for "query projection"
  * limit: Additional param to stop fetching if the number of records fetched reached this limit. Limit is ignored as long as the record 'Modified Time' fetched is still the same as requested lastModifiedTime.
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values. 
    * newFormat=2: To include fields with "null" values.

Returns:
 
  * Array of objects, representing zoho records you requested.

Example:

```
[
  {
    CONTACT_ID: '12312412312315',
    'First Name': 'Joko',
    'Last Name': 'Susilo',
    'Email': ...,
    ...
  },
  {
    CONTACT_ID: '12312412312318',
    'First Name': 'Suparman',
    'Last Name': 'Prasetya',
    'Email': ...,
    ...
  }
]
```

Note:

  * Can get arbitrarily many records, even though zoho limit us by 200 records. This library will split it to chunks and fetch sequentially.
  * May take a long time depending on how many records to fetch.

## [getByCriteria](https://www.zoho.com/crm/help/api/searchrecords.html)

Find up to 200 records based on criteria. If you need more, then we need to implement getBulkByCriteria.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  criteria: '((Email:some@one.com) OR (Email:any@one.com))'
}

zohorde.getByCriteria(moduleName, params);
```

Params:

  * lastModifiedTime: String in format 'YYYY-MM-DD HH:mm:ss'
  * criteria: String representing the criteria, consult [zoho API documentation](https://www.zoho.com/crm/help/api/searchrecords.html) for the format
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values. 
    * newFormat=2: To include fields with "null" values.

Returns:
 
  * Array of objects representing zoho record you requested.
  * Empty array, of course, if no record match your request.

Example:

```
[
  {
    CONTACT_ID: '12312412312315',
    'First Name': 'Joko',
    'Last Name': 'Susilo',
    'Email': 'some@one.com',
    ...
  },
  {
    CONTACT_ID: '12312412312317',
    'First Name': 'Suparman',
    'Last Name': 'Prasetya',
    'Email': 'any@one.com',
    ...
  }
]
```

## [getBulkByValueIn](https://www.zoho.com/crm/help/api/getrecords.html)

An extension from getByCriteria, specifically used for fetching some records with value in given list.

Typical usage:

```js
var moduleName = 'Contact';
var params = {
  key: 'Email',
  valueIn: ['some@one.com', 'any@one.com']
};

zohorde.getBulkByValueIn(moduleName, params);
```

Params:

  * lastModifiedTime: String in format 'YYYY-MM-DD HH:mm:ss'
  * key: String for the field name to be used in matching
  * valueIn: Array of strings for the allowed value
  * newFormat: 
    * newFormat=1: To exclude fields with "null" values. 
    * newFormat=2: To include fields with "null" values.

Returns:
 
  * Array of objects, representing zoho records you requested.

Example:

```
[
  {
    CONTACT_ID: '12312412312315',
    'First Name': 'Joko',
    'Last Name': 'Susilo',
    'Email': ...,
    ...
  },
  {
    CONTACT_ID: '12312412312318',
    'First Name': 'Suparman',
    'Last Name': 'Prasetya',
    'Email': ...,
    ...
  }
]
```

Note:

  * Can get arbitrarily many records, even though zoho limit us by some records. This library will split it to chunks and fetch sequentially.
  * This works by converting the "$in" query to chain of "$or". It is limited to 5 "$or" clause per request
  * May take a long time depending on how many records to fetch.
