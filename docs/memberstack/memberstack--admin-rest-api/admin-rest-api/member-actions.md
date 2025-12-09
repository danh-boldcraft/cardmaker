[ Memberstack Developers Documentation](/)

[](/)

Admin Rest API

  * [Quick Start](/admin-rest-api/quick-start)

  * [Member Actions](/admin-rest-api/member-actions)

    * [List Members](/admin-rest-api/member-actions#list-members)
    * [Get Member](/admin-rest-api/member-actions#get-member)
    * [Create Member](/admin-rest-api/member-actions#create-member)
    * [Update Member](/admin-rest-api/member-actions#update-member)
    * [Delete Member](/admin-rest-api/member-actions#delete-member)
    * [Plan Management](/admin-rest-api/member-actions#plan-management)
  * [Data Tables](/admin-rest-api/data-tables)

  * [Verification](/admin-rest-api/verification)

  * [Common Use Cases](/admin-rest-api/common-use-cases)

  * [FAQs](/admin-rest-api/faqs)




# Member Actions

The Memberstack Admin REST API provides powerful endpoints for member management. This guide covers all member-related operations including listing, retrieving, creating, updating, and deleting members.

### Before You Start

  * Make sure you have your secret key ready (refer to the [Quick Start](/admin-rest-api/quick-start) guide for authentication details)
  * All examples assume you've set up proper authentication headers
  * Be mindful of the rate limit (25 requests per second)



## List Members

Retrieve a paginated list of all members in your application.

### Endpoint

GET https://admin.memberstack.com/members

### URL Parameters

Parameter| Type| Description  
---|---|---  
after| number| The endCursor after which the querying should start  
order| string| The order in which members should be queried (ASC or DESC, default: ASC)  
limit| number| The maximum number of members to return (default: 50, max: 200)  
  
### Examples

Using curl:

1

curl --location --request GET 'https://admin.memberstack.com/members' \

\--header 'x-api-key: sk_sb_your_secret_key'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = { "X-API-KEY": API_KEY };

// Basic request

const response = await axios.get(BASE_URL, { headers });

// With pagination

const paginatedResponse = await axios.get(BASE_URL, {

headers,

params: {

limit: 10,

after: 123456,

order: 'DESC'

}

});

### Response

{

"totalCount": 25, // Total number of members

"endCursor": 456, // Cursor for pagination

"hasNextPage": true, // Whether more results exist

"data": [ // Array of member objects

{

"id": "mem_abc123",

"createdAt": "2022-05-19T18:57:35.143Z",

"lastLogin": "2022-05-19T18:57:35.143Z",

"auth": {

"email": "john@example.com"

},

"customFields": {

"country": "Germany"

},

"metaData": {

"avatar": "photo.png"

},

"loginRedirect": "/welcome",

"permissions": ["view:basic:workouts"],

"planConnections": [

{

"id": "con_xyz789",

"status": "ACTIVE",

"planId": "pln_123abc",

"type": "FREE",

"payment": null

}

]

},

// Additional members...

]

}

💡 **Tip:**

Tips for working with pagination:

  * Use the `endCursor` value from the response as the `after` parameter in your next request
  * Check `hasNextPage` to determine if more results are available
  * Set appropriate `limit` values to balance request count and payload size



## Get Member

Retrieve a specific member by ID or email.

### Endpoint

GET https://admin.memberstack.com/members/:id_or_email

#### URL Parameters

Replace `:id_or_email` with either:

  * Member ID (starts with "mem_")
  * Member email address (URL-encoded)



### Examples

Get member by ID:

1

curl --location --request GET 'https://admin.memberstack.com/members/mem_abc123' \

\--header 'x-api-key: sk_sb_your_secret_key'

Get member by email:

// Remember to URL-encode the email address

curl --location --request GET 'https://admin.memberstack.com/members/example%40test.com' \

\--header 'x-api-key: sk_sb_your_secret_key'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = { "X-API-KEY": API_KEY };

// Get by ID

const member = await axios.get(`${BASE_URL}/mem_abc123`, { headers });

// Get by email (URL-encode the email)

const encodedEmail = encodeURIComponent('user@example.com');

const memberByEmail = await axios.get(`${BASE_URL}/${encodedEmail}`, { headers });

### Response

{

"data": {

"id": "mem_abc123",

"auth": {

"email": "user@example.com"

},

"createdAt": "2022-05-19T18:57:35.143Z",

"lastLogin": "2022-05-19T18:57:35.143Z",

"metaData": {

"language": "English"

},

"customFields": {

"country": "United States",

"firstName": "John"

},

"permissions": ["view:content"],

"loginRedirect": "/dashboard",

"planConnections": [

{

"id": "con_xyz789",

"status": "ACTIVE",

"planId": "pln_123abc",

"type": "FREE",

"payment": null

}

]

}

}

## Create Member

Create a new member in your application.

### Endpoint

POST https://admin.memberstack.com/members

### Request Body

Parameter| Type| Required| Description  
---|---|---|---  
email| string| Yes| The member's email address  
password| string| Yes| The member's password  
plans| array| No| Array of plan objects: `[{'planId': 'pln_abc'}]`  
customFields| object| No| Custom fields for the member  
metaData| object| No| Metadata for the member  
json| object| No| JSON data for the member  
loginRedirect| string| No| URL to redirect to after login  
  
### Examples

Using curl:

curl --location --request POST 'https://admin.memberstack.com/members' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"email": "john@example.com",

"password": "securePassword123",

"plans": [

{

"planId": "pln_abc123"

}

],

"customFields": {

"firstName": "John",

"lastName": "Doe",

"country": "USA"

},

"metaData": {

"source": "API"

},

"json": {

"preferences": {

"theme": "dark",

"notifications": true

}

},

"loginRedirect": "/dashboard"

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const data = {

email: "john@example.com",

password: "securePassword123",

plans: [

{

planId: "pln_abc123"

}

],

customFields: {

firstName: "John",

lastName: "Doe",

country: "USA"

},

metaData: {

source: "API"

},

json: {

preferences: {

theme: "dark",

notifications: true

}

},

loginRedirect: "/dashboard"

};

const response = await axios.post(BASE_URL, data, { headers });

### Response

{

"data": {

"id": "mem_new123",

"auth": {

"email": "john@example.com"

},

"createdAt": "2023-01-19T12:34:56.789Z",

"metaData": {

"source": "API"

},

"customFields": {

"firstName": "John",

"lastName": "Doe",

"country": "USA"

},

"json": {

"preferences": {

"theme": "dark",

"notifications": true

}

},

"permissions": [],

"loginRedirect": "/dashboard",

"planConnections": [

{

"id": "con_new456",

"status": "ACTIVE",

"planId": "pln_abc123",

"type": "FREE",

"payment": null

}

]

}

}

⚠️ **Important:**

Important notes when creating members:

  * The `plans` array is only for free plans (those with IDs starting with `pln_`)
  * For paid plans, members need to go through the Stripe checkout flow using the DOM package
  * Passwords should be secure and meet your organization's requirements
  * Email addresses must be unique within your Memberstack application



## Update Member

Update an existing member's information.

### Endpoint

PATCH https://admin.memberstack.com/members/:id

#### URL Parameters

Replace `:id` with the member's ID (starts with "mem_")

### Request Body

You can update any of the following fields:

Parameter| Type| Description  
---|---|---  
email| string| Update the member's email address  
customFields| object| Update custom fields  
metaData| object| Update metadata  
json| object| Update JSON data  
loginRedirect| string| Update login redirect URL  
  
### Examples

Using curl:

curl --location --request PATCH 'https://admin.memberstack.com/members/mem_abc123' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"customFields": {

"firstName": "John",

"lastName": "Updated",

"country": "Canada"

},

"email": "john.updated@example.com",

"metaData": {

"lastUpdated": "2023-01-20"

}

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const data = {

customFields: {

firstName: "John",

lastName: "Updated",

country: "Canada"

},

email: "john.updated@example.com",

metaData: {

lastUpdated: "2023-01-20"

}

};

const response = await axios.patch(`${BASE_URL}/mem_abc123`, data, { headers });

### Response

{

"data": {

"id": "mem_abc123",

"auth": {

"email": "john.updated@example.com"

},

"createdAt": "2022-05-19T18:57:35.143Z",

"lastLogin": "2022-05-19T18:57:35.143Z",

"metaData": {

"lastUpdated": "2023-01-20"

},

"customFields": {

"firstName": "John",

"lastName": "Updated",

"country": "Canada"

},

"permissions": ["view:content"],

"loginRedirect": "/dashboard",

"planConnections": [

{

"id": "con_xyz789",

"status": "ACTIVE",

"planId": "pln_123abc",

"type": "FREE",

"payment": null

}

]

}

}

💡 **Tip:**

Tips when updating members:

  * Updates are partial - you only need to include the fields you want to change
  * For `customFields`, `metaData`, and `json` objects, the entire object will be replaced
  * If you only need to update specific fields within these objects, first get the current values, modify them, then update



## Delete Member

Permanently remove a member from your application.

### Endpoint

DELETE https://admin.memberstack.com/members/:id

#### URL Parameters

Replace `:id` with the member's ID (starts with "mem_")

### Request Body (Optional)

Parameter| Type| Default| Description  
---|---|---|---  
deleteStripeCustomer| boolean| false| Delete the associated Stripe customer  
cancelStripeSubscriptions| boolean| false| Cancel the associated Stripe subscriptions  
  
### Examples

Basic deletion with curl:

1

curl --location --request DELETE 'https://admin.memberstack.com/members/mem_abc123' \

\--header 'x-api-key: sk_sb_your_secret_key'

Advanced deletion with curl:

curl --location --request DELETE 'https://admin.memberstack.com/members/mem_abc123' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"deleteStripeCustomer": true,

"cancelStripeSubscriptions": true

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

// Basic deletion

const response = await axios.delete(`${BASE_URL}/mem_abc123`, { headers });

// Advanced deletion

const advancedResponse = await axios.delete(`${BASE_URL}/mem_abc123`, {

headers,

data: {

deleteStripeCustomer: true,

cancelStripeSubscriptions: true

}

});

### Response

{

"data": {

"id": "mem_abc123"

}

}

⚠️ **Important:**

**Warning:** Deleting a member is permanent and cannot be undone.

  * Consider implementing a soft-delete mechanism in your application if you need to preserve member data
  * Use the `deleteStripeCustomer` and `cancelStripeSubscriptions` options carefully
  * Make sure to handle any dependent resources in your own database



## Plan Management

Add and remove free plans from members.

### Add a Free Plan

Add a free plan to an existing member:

POST https://admin.memberstack.com/members/:id/add-plan

#### URL Parameters

Replace `:id` with the member's ID (starts with "mem_")

### Request Body

Parameter| Type| Required| Description  
---|---|---|---  
planId| string| Yes| The ID of the free plan to add (starts with "pln_")  
  
### Examples

Using curl:

curl --location --request POST 'https://admin.memberstack.com/members/mem_abc123/add-plan' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"planId": "pln_free123"

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const data = {

planId: "pln_free123"

};

const response = await axios.post(`${BASE_URL}/mem_abc123/add-plan`, data, { headers });

### Response

A successful request returns a 200 status code with no response body.

### Remove a Free Plan

Remove a free plan from an existing member:

POST https://admin.memberstack.com/members/:id/remove-plan

#### URL Parameters

Replace `:id` with the member's ID (starts with "mem_")

### Request Body

Parameter| Type| Required| Description  
---|---|---|---  
planId| string| Yes| The ID of the free plan to remove (starts with "pln_")  
  
### Examples

Using curl:

curl --location --request POST 'https://admin.memberstack.com/members/mem_abc123/remove-plan' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"planId": "pln_free123"

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const data = {

planId: "pln_free123"

};

const response = await axios.post(`${BASE_URL}/mem_abc123/remove-plan`, data, { headers });

### Response

A successful request returns a 200 status code with no response body.

⚠️ **Important:**

Important notes about plan management:

  * These endpoints only work with free plans (plan IDs starting with `pln_`)
  * For paid plans, use the DOM package's checkout flow or Stripe Customer Portal
  * Removing a plan immediately revokes the member's access to that plan's features
  * A member can have multiple plans simultaneously



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
