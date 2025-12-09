[ Memberstack Developers Documentation](/)

[](/)

Admin Node Package

  * [Quick Start](/admin-node-package/quick-start)

  * [Member Actions](/admin-node-package/member-actions)

    * [List all members](/admin-node-package/member-actions#list-all-members)
    * [Retrieve a member](/admin-node-package/member-actions#retrieve-a-member)
    * [Create a member](/admin-node-package/member-actions#create-a-member)
    * [Update a member](/admin-node-package/member-actions#update-a-member)
    * [Delete a member](/admin-node-package/member-actions#delete-a-member)
    * [Add a free plan to a member](/admin-node-package/member-actions#add-a-free-plan-to-a-member)
    * [Remove a free plan from a member](/admin-node-package/member-actions#remove-a-free-plan-from-a-member)
  * [Verification](/admin-node-package/verification)

  * [Common Use Cases](/admin-node-package/common-use-cases)

  * [FAQs](/admin-node-package/faqs)




# Member Actions

The Admin Package provides powerful methods to manage members through your server-side code. This section covers the complete set of member management capabilities, including listing, creating, updating, and deleting members.

### Before You Start

  * Make sure you've initialized the Admin Package with your secret key as shown in the [Quick Start](/admin-node-package/quick-start) guide
  * Consider using test mode (sandbox) for development and testing
  * Be aware of API rate limits (25 requests per second). 
    * If you are hitting this limit, consider caching responses



## List All Members

Retrieve a paginated list of members in your application.

The `members.list()` method allows you to fetch members with pagination support:

// Basic usage

const members = await memberstack.members.list();

// With pagination and ordering

const members = await memberstack.members.list({

after: 2458433, // Start after this cursor

limit: 5, // Return max 5 members

order: "DESC" // Descending order (newest first)

});

#### Response Structure:

{

totalCount: 2, // Total number of members

endCursor: 456, // Cursor for pagination

hasNextPage: false, // Whether more members exist

data: [

{

id: "mem_abc123",

createdAt: "2022-05-19T18:57:35.143Z",

lastLogin: "2022-05-19T18:57:35.143Z",

auth: {

email: "john@example.com"

},

customFields: {

country: "Germany"

},

metaData: {

avatar: "photo.png"

},

loginRedirect: "/welcome",

permissions: ["view:basic:workouts"],

planConnections: [

{

id: "con_xyz789",

status: "ACTIVE",

planId: "pln_123abc",

type: "FREE",

payment: null

}

]

},

// Additional members...

]

}

💡 **Tip:**

For applications with large member bases, implement pagination best practices:

  * Use the `limit` parameter to control response size. The default is 50 and the max is 100
  * Store the `endCursor` value to continue paginating from where you left off
  * Check `hasNextPage` to determine if more members exist



## Retrieve a Member

Get detailed information about a specific member by ID.

To fetch a single member by ID, use the `members.retrieve()` method:

const member = await memberstack.members.retrieve({

id: "mem_abc123"

});

#### Response:

The response contains the complete member data:

{

data: {

id: "mem_abc123",

createdAt: "2022-05-19T18:57:35.143Z",

lastLogin: "2022-05-19T18:57:35.143Z",

auth: {

email: "john@example.com"

},

customFields: {

firstName: "John",

lastName: "Doe"

},

metaData: {

avatar: "avatar.jpg"

},

json: {

preferences: {

darkMode: true

}

},

permissions: ["view:content"],

loginRedirect: "/dashboard",

planConnections: [

{

id: "con_xyz789",

status: "ACTIVE",

planId: "pln_123abc",

type: "FREE",

payment: null

}

]

}

}

#### Error Handling

Handle cases where a member isn't found or other API errors occur:

try {

const member = await memberstack.members.retrieve({

id: "mem_abc123"

});

// Process member data

console.log(member.data);

} catch (error) {

if (error.status === 404) {

console.error("Member not found");

} else {

console.error(`API error: ${error.message}`);

}

}

## Create a Member

Programmatically create new members in your application.

The `members.create()` method allows you to create new members with custom data and optional plan connections:

const newMember = await memberstack.members.create({

email: "jane@example.com",

password: "SecurePassword123",

plans: [

{

"planId": "pln_abc123"

}

],

customFields: {

firstName: "Jane",

lastName: "Smith"

},

metaData: {

source: "Admin API"

},

json: {

preferences: {

newsletter: true,

darkMode: false

}

},

loginRedirect: "/dashboard"

});

#### Required and Optional Parameters

  * **Required:**
    * `email` \- The member's email address
    * `password` \- The member's password
  * **Optional:**
    * `plans` \- Array of plan objects to connect
    * `customFields` \- Object containing custom data fields
    * `metaData` \- Object for internal metadata
    * `json` \- Object for complex JSON data
    * `loginRedirect` \- URL to redirect after login



⚠️ **Important:**

When creating members programmatically:

  * Always use strong passwords or implement passwordless options
  * Consider notifying members that their account has been created
  * For paid plans, use the DOM package's checkout flow instead



## Update a Member

Modify existing member information using the Admin API.

Use the `members.update()` method to modify a member's information. Only the fields you include will be updated:

const updatedMember = await memberstack.members.update({

id: "mem_abc123",

data: {

// Update email (this will NOT send a verification email)

email: "jane.updated@example.com",

// Update custom fields

customFields: {

firstName: "Jane",

lastName: "Johnson",

country: "Canada"

},

// Update metadata

metaData: {

lastUpdated: new Date().toISOString()

},

// Update JSON data

json: {

preferences: {

newsletter: false,

darkMode: true

}

},

// Update login redirect

loginRedirect: "/new-dashboard"

}

});

💡 **Tip:**

Tips for updating members:

  * Only include the fields you want to change
  * If you want to delete a custom field from a member, set it to `null`
  * You must use Memberstack's custom field ID format, which uses kebab-case with hyphens (like `first-name`) rather than camelCase (like `firstName`). Always use the exact string ID as shown in your Memberstack dashboard.
  * Consider implementing validation before updates
  * When updating email addresses, no verification email is sent by default - you may need to handle this manually



## Delete a Member

Permanently remove a member from your application.

To delete a member, use the `members.delete()` method:

const result = await memberstack.members.delete({

id: "mem_abc123"

});

// Result contains the deleted member ID

console.log(`Deleted member: ${result.data.id}`);

⚠️ **Important:**

**Warning:** Deleting a member is permanent and cannot be undone. Consider these precautions:

  * Implement confirmation steps before deletion
  * Backup important member data if needed
  * Consider using a "deactivated" flag instead of full deletion
  * Handle any dependent resources in your application



## Add a Free Plan to a Member

Give a member access to a free plan programmatically.

To add a free plan to an existing member:

await memberstack.members.addFreePlan({

id: "mem_abc123",

data: {

planId: "pln_free_plan"

}

});

#### Important Notes

  * This method only works with free plans (plan IDs starting with "pln_")
  * For paid plans, use the DOM package's checkout flow
  * Members can have multiple plans simultaneously



## Remove a Free Plan from a Member

Revoke access to a free plan programmatically.

To remove a free plan from a member:

await memberstack.members.removeFreePlan({

id: "mem_abc123",

data: {

planId: "pln_free_plan"

}

});

💡 **Tip:**

When removing plans:

  * Consider notifying the member about plan changes
  * Handle any access control logic in your application
  * Update any relevant user interfaces to reflect plan status



## Next Steps

Now that you understand member management, you might want to explore:

  * [→ Token and Webhook Verification](/admin-node-package/verification)
  * [→ Common Use Cases](/admin-node-package/common-use-cases)
  * [→ Frequently Asked Questions](/admin-node-package/faqs)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
