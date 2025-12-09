[ Memberstack Developers Documentation](/)

[](/)

Admin Rest API

  * [Quick Start](/admin-rest-api/quick-start)

  * [Member Actions](/admin-rest-api/member-actions)

  * [Data Tables](/admin-rest-api/data-tables)

    * [Overview](/admin-rest-api/data-tables#overview)
    * [List Data Tables](/admin-rest-api/data-tables#list-data-tables)
    * [Get Data Table](/admin-rest-api/data-tables#get-data-table)
    * [Create Data Record](/admin-rest-api/data-tables#create-data-record)
    * [Update Data Record](/admin-rest-api/data-tables#update-data-record)
    * [Delete Data Record](/admin-rest-api/data-tables#delete-data-record)
    * [Query Data Records](/admin-rest-api/data-tables#query-data-records)
    * [Error Handling](/admin-rest-api/data-tables#error-handling)
  * [Verification](/admin-rest-api/verification)

  * [Common Use Cases](/admin-rest-api/common-use-cases)

  * [FAQs](/admin-rest-api/faqs)




# Data Tables

The Memberstack Admin REST API provides powerful endpoints for managing Data Tables. Data Tables allow you to store structured data with support for relationships, access control rules, and advanced querying capabilities.

### Before You Start

  * Make sure you have your secret key ready (refer to the [Quick Start](/admin-rest-api/quick-start) guide for authentication details)
  * All Data Tables endpoints use the `/v2` API version
  * Be mindful of the rate limit (25 requests per second)
  * Data Tables must be created in the Memberstack dashboard before using the API



## Overview

Data Tables API endpoints and capabilities.

The Data Tables API provides six endpoints for complete data management:

Method| Endpoint| Description  
---|---|---  
GET| /v2/data-tables| List all data tables  
GET| /v2/data-tables/:tableKey| Get a specific table by key or ID  
POST| /v2/data-tables/:tableKey/records| Create a new record  
POST| /v2/data-tables/:tableKey/records/query| Query records with filters  
PUT| /v2/data-tables/:tableKey/records/:recordId| Update an existing record  
DELETE| /v2/data-tables/:tableKey/records/:recordId| Delete a record  
  
### Field Types

Data Tables support the following field types:

  * `TEXT` \- String values
  * `TEXT_UNIQUE` \- String values with unique constraint
  * `NUMBER` \- Numeric values
  * `DECIMAL` \- Decimal/currency values
  * `BOOLEAN` \- True/false values
  * `DATE` \- Date and time values
  * `EMAIL` \- Email address values
  * `URL` \- URL values
  * `REFERENCE` \- Single record relationship
  * `REFERENCE_MANY` \- Multiple record relationships
  * `MEMBER_REFERENCE` \- Single member relationship
  * `MEMBER_REFERENCE_MANY` \- Multiple member relationships



## List Data Tables

Retrieve all data tables in your application.

### Endpoint

GET https://admin.memberstack.com/v2/data-tables

### Examples

Using curl:

1

curl --location --request GET 'https://admin.memberstack.com/v2/data-tables' \

\--header 'x-api-key: sk_sb_your_secret_key'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/v2/data-tables';

const headers = { "X-API-KEY": API_KEY };

const response = await axios.get(BASE_URL, { headers });

console.log(response.data);

### Response

{

"data": {

"tables": [

{

"id": "tbl_cm1abc123def456",

"key": "products",

"name": "Products",

"createRule": "AUTHENTICATED",

"readRule": "PUBLIC",

"updateRule": "AUTHENTICATED_OWN",

"deleteRule": "ADMIN_ONLY",

"createdAt": "2024-01-15T10:30:00.000Z",

"updatedAt": "2024-01-20T14:45:00.000Z",

"fields": [

{

"id": "cm2xyz789ghi012abc",

"key": "name",

"name": "Product Name",

"type": "TEXT",

"required": true,

"defaultValue": null,

"tableOrder": 0,

"referencedTableId": null

},

{

"id": "cm3def456jkl789xyz",

"key": "price",

"name": "Price",

"type": "DECIMAL",

"required": true,

"defaultValue": null,

"tableOrder": 0,

"referencedTableId": null

},

{

"id": "cm4ghi789mno012def",

"key": "category",

"name": "Category",

"type": "REFERENCE",

"required": false,

"defaultValue": null,

"tableOrder": 0,

"referencedTableId": "tbl_cm5cat001pqr345",

"referencedTable": {

"id": "tbl_cm5cat001pqr345",

"key": "categories",

"name": "Categories"

}

}

]

}

]

}

}

## Get Data Table

Retrieve a specific data table by key or ID.

### Endpoint

GET https://admin.memberstack.com/v2/data-tables/:tableKey

#### URL Parameters

Replace `:tableKey` with either:

  * Table key (e.g., `products`)
  * Table ID (e.g., `tbl_cm1abc123def456`)



### Examples

Using curl:

1

curl --location --request GET 'https://admin.memberstack.com/v2/data-tables/products' \

\--header 'x-api-key: sk_sb_your_secret_key'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/v2/data-tables';

const headers = { "X-API-KEY": API_KEY };

// Get by table key

const response = await axios.get(`${BASE_URL}/products`, { headers });

// Or get by table ID

const responseById = await axios.get(`${BASE_URL}/tbl_cm1abc123def456`, { headers });

### Response

{

"data": {

"id": "tbl_cm1abc123def456",

"key": "products",

"name": "Products",

"createRule": "AUTHENTICATED",

"readRule": "PUBLIC",

"updateRule": "AUTHENTICATED_OWN",

"deleteRule": "ADMIN_ONLY",

"createdAt": "2024-01-15T10:30:00.000Z",

"updatedAt": "2024-01-20T14:45:00.000Z",

"fields": [

{

"id": "cm2xyz789ghi012abc",

"key": "name",

"name": "Product Name",

"type": "TEXT",

"required": true,

"defaultValue": null,

"tableOrder": 0,

"referencedTableId": null

}

]

}

}

## Create Data Record

Create a new record in a data table.

### Endpoint

POST https://admin.memberstack.com/v2/data-tables/:tableKey/records

#### URL Parameters

Replace `:tableKey` with the table key or ID

### Request Body

Parameter| Type| Required| Description  
---|---|---|---  
data| object| Yes| Object containing field key-value pairs  
  
### Examples

Using curl:

curl --location --request POST 'https://admin.memberstack.com/v2/data-tables/products/records' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"data": {

"name": "Premium Widget",

"price": 29.99,

"inStock": true,

"category": "cm6cat001stu678abc"

}

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/v2/data-tables';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const response = await axios.post(`${BASE_URL}/products/records`, {

data: {

name: "Premium Widget",

price: 29.99,

inStock: true,

category: "cm6cat001stu678abc" // Reference to another record

}

}, { headers });

console.log(response.data);

### Response

{

"data": {

"id": "cm7new123vwx901def",

"tableKey": "products",

"data": {

"name": "Premium Widget",

"price": 29.99,

"inStock": true,

"category": "cm6cat001stu678abc"

},

"createdAt": "2024-01-25T09:15:00.000Z",

"updatedAt": "2024-01-25T09:15:00.000Z",

"internalOrder": 12345

}

}

💡 **Tip:**

Tips for creating records:

  * Fields with default values will be automatically populated if not provided
  * For REFERENCE fields, provide the referenced record's ID
  * For REFERENCE_MANY fields, provide an array of record IDs
  * Required fields must be provided or have a default value
  * The Admin API does not set `createdByMemberId` \- use the Client API if you need to track which member created each record



## Update Data Record

Update an existing record in a data table.

### Endpoint

PUT https://admin.memberstack.com/v2/data-tables/:tableKey/records/:recordId

#### URL Parameters

  * Replace `:tableKey` with the table key or ID
  * Replace `:recordId` with the record ID



### Request Body

Parameter| Type| Required| Description  
---|---|---|---  
data| object| Yes| Object containing field key-value pairs to update (cannot be empty)  
  
### Examples

Using curl:

curl --location --request PUT 'https://admin.memberstack.com/v2/data-tables/products/records/cm8abc123yza234ghi' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"data": {

"price": 39.99,

"inStock": false

}

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/v2/data-tables';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const response = await axios.put(

`${BASE_URL}/products/records/cm8abc123yza234ghi`,

{

data: {

price: 39.99,

inStock: false

}

},

{ headers }

);

console.log(response.data);

### Response

{

"data": {

"id": "cm8abc123yza234ghi",

"tableKey": "products",

"data": {

"name": "Premium Widget",

"price": 39.99,

"inStock": false,

"category": "cm6cat001stu678abc"

},

"createdAt": "2024-01-25T09:15:00.000Z",

"updatedAt": "2024-01-26T11:30:00.000Z",

"internalOrder": 12345

}

}

💡 **Tip:**

Tips for updating records:

  * Updates are partial - only include the fields you want to change
  * The data object cannot be empty
  * Unique constraints are validated (excluding the current record)
  * Reference constraints are validated for relationship fields



## Delete Data Record

Delete a record from a data table.

### Endpoint

DELETE https://admin.memberstack.com/v2/data-tables/:tableKey/records/:recordId

#### URL Parameters

  * Replace `:tableKey` with the table key or ID
  * Replace `:recordId` with the record ID



### Examples

Using curl:

1

curl --location --request DELETE 'https://admin.memberstack.com/v2/data-tables/products/records/cm8abc123yza234ghi' \

\--header 'x-api-key: sk_sb_your_secret_key'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/v2/data-tables';

const headers = { "X-API-KEY": API_KEY };

const response = await axios.delete(

`${BASE_URL}/products/records/cm8abc123yza234ghi`,

{ headers }

);

console.log(response.data);

### Response

{

"data": {

"id": "cm8abc123yza234ghi",

"tableKey": "products",

"data": {

"name": "Premium Widget",

"price": 39.99,

"inStock": false,

"category": "cm6cat001stu678abc"

},

"createdAt": "2024-01-25T09:15:00.000Z",

"updatedAt": "2024-01-26T11:30:00.000Z",

"internalOrder": 12345

}

}

⚠️ **Important:**

**Warning:** Deleting a record is permanent and cannot be undone.

  * The deleted record data is returned in the response
  * Consider the impact on related records before deletion
  * Implement soft-delete in your application if you need to preserve data



## Query Data Records

Query records with advanced filtering, sorting, and pagination.

### Endpoint

POST https://admin.memberstack.com/v2/data-tables/:tableKey/records/query

#### URL Parameters

Replace `:tableKey` with the table key or ID

### Request Body

The query endpoint uses a Prisma-like query syntax with either `findMany` or `findUnique`.

Parameter| Type| Description  
---|---|---  
query.findMany| object| Query multiple records (mutually exclusive with findUnique)  
query.findUnique| object| Query a single record by ID (mutually exclusive with findMany)  
  
### Query Options (findMany)

Option| Type| Description  
---|---|---  
where| object| Filter conditions  
include| object| Include related records or counts  
select| object| Select specific fields (cannot use with include)  
orderBy| object | array| Sort results  
take| number| Limit number of results (max 100)  
skip| number| Offset pagination (max 10000)  
after| number | string| Cursor-based pagination (cannot use with skip)  
_count| boolean| Return only the count of matching records  
  
### Where Operators

Filter conditions support the following operators:

Operator| Description| Example  
---|---|---  
equals| Exact match| { price: { equals: 29.99 } }  
not| Not equal| { status: { not: 'archived' } }  
in| In array| { status: { in: ['active', 'pending'] } }  
notIn| Not in array| { status: { notIn: ['deleted'] } }  
lt| Less than| { price: { lt: 100 } }  
lte| Less than or equal| { price: { lte: 100 } }  
gt| Greater than| { price: { gt: 50 } }  
gte| Greater than or equal| { price: { gte: 50 } }  
contains| Contains substring| { name: { contains: 'widget' } }  
startsWith| Starts with| { name: { startsWith: 'Premium' } }  
endsWith| Ends with| { name: { endsWith: 'Pro' } }  
  
Logical operators `AND`, `OR`, and `NOT` can be used to combine conditions.

### Examples

Basic query with filters:

const response = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

where: {

inStock: true,

price: { gte: 20, lte: 100 }

},

orderBy: { price: 'asc' },

take: 10

}

}

}, { headers });

Query with pagination:

// First page

const firstPage = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

take: 20,

orderBy: { createdAt: 'desc' }

}

}

}, { headers });

// Next page using cursor

const nextPage = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

take: 20,

after: firstPage.data.data.pagination.endCursor,

orderBy: { createdAt: 'desc' }

}

}

}, { headers });

Query with related records:

const response = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

where: { inStock: true },

include: {

category: true, // Include referenced category

_count: {

select: {

orders: true // Count related orders

}

}

}

}

}

}, { headers });

Query with logical operators:

const response = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

where: {

OR: [

{ price: { lt: 10 } },

{ AND: [

{ price: { gte: 50 } },

{ inStock: true }

]}

]

}

}

}

}, { headers });

Count query:

const response = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

where: { inStock: true },

_count: true

}

}

}, { headers });

// Response: { "data": { "_count": 42 } }

Find unique record:

const response = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findUnique: {

where: { id: "cm8abc123yza234ghi" },

include: {

category: true

}

}

}

}, { headers });

Date range query:

const response = await axios.post(`${BASE_URL}/products/records/query`, {

query: {

findMany: {

where: {

createdAt: {

gte: "2024-01-01T00:00:00.000Z",

lt: "2024-02-01T00:00:00.000Z"

}

}

}

}

}, { headers });

### Response (findMany)

{

"data": {

"records": [

{

"id": "cm8abc123yza234ghi",

"internalOrder": 12345,

"createdAt": "2024-01-25T09:15:00.000Z",

"updatedAt": "2024-01-26T11:30:00.000Z",

"data": {

"name": "Premium Widget",

"price": 29.99,

"inStock": true

}

}

],

"pagination": {

"hasMore": true,

"limit": 20,

"endCursor": 12345

}

}

}

### Response (findUnique)

{

"data": {

"record": {

"id": "cm8abc123yza234ghi",

"internalOrder": 12345,

"createdAt": "2024-01-25T09:15:00.000Z",

"updatedAt": "2024-01-26T11:30:00.000Z",

"data": {

"name": "Premium Widget",

"price": 29.99,

"inStock": true,

"category": {

"id": "cm6cat001stu678abc",

"data": {

"name": "Electronics"

}

}

}

}

}

}

💡 **Tip:**

Query best practices:

  * Use cursor-based pagination (`after`) for better performance on large datasets
  * Limit your `take` value to only what you need (max 100)
  * Use `select` to retrieve only the fields you need
  * Maximum include depth is 3 levels
  * Maximum of 10 includes per query
  * Maximum of 50 where conditions per query



⚠️ **Important:**

Query limitations:

  * Cannot use both `skip` and `after` together
  * Cannot use both `include` and `select` together
  * `findUnique` only allows `id` in the where clause
  * `findUnique` does not support `take`, `skip`, `after`, or `orderBy`
  * `findUnique` does not support top-level `_count` (use within includes instead)
  * REFERENCE_MANY and MEMBER_REFERENCE_MANY includes are only available in `findUnique`



## Error Handling

Common errors and how to handle them.

The API returns consistent error responses with a code and message:

{

"code": "error-code",

"message": "Error description here"

}

### Common Errors

Status| Error| Description  
---|---|---  
400| Table key is required| Missing table key in URL  
400| Record ID is required| Missing record ID in URL  
400| data must be an object| Invalid data format in request body  
400| data cannot be empty| Update request with empty data object  
400| Query parameter is required| Missing query in request body  
400| Invalid table key or ID format| Table key contains invalid characters  
400| take must be between 1 and 100| Query take value out of range  
400| Either query.findMany or query.findUnique parameter is required| Missing query type in request body  
400| Cannot specify both query.findMany and query.findUnique| Both query types provided  
400| query.findUnique requires where.id| Missing id in findUnique where clause  
404| Data table not found| Table doesn't exist or wrong app  
404| Data record not found| Record doesn't exist  
404| Record not found| findUnique query returned no results  
  
### Error Handling Example

try {

const response = await axios.post(`${BASE_URL}/products/records`, {

data: {

name: "New Product",

price: 29.99

}

}, { headers });

console.log('Record created:', response.data);

} catch (error) {

if (error.response) {

// Server responded with error

console.error('Error code:', error.response.data.code);

console.error('Error message:', error.response.data.message);

console.error('Status:', error.response.status);

switch (error.response.status) {

case 400:

// Handle validation errors

break;

case 404:

// Handle not found errors

break;

default:

// Handle other errors

}

} else {

// Network or other error

console.error('Network error:', error.message);

}

}

## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
