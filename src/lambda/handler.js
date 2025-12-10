const https = require('https');

function memberstackRequest(path, method, body, secretKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'admin.memberstack.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'X-API-KEY': secretKey,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function handleMemberInfo(event) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Extract token from Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing or invalid Authorization header' })
    };
  }

  const token = authHeader.split(' ')[1];
  const secretKey = process.env.MEMBERSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error('MEMBERSTACK_SECRET_KEY not configured');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // Step 1: Verify token with Memberstack
    const verifyResult = await memberstackRequest('/members/verify-token', 'POST', { token }, secretKey);
    const memberId = verifyResult.data.id;

    // Step 2: Get full member data
    const memberResult = await memberstackRequest(`/members/${memberId}`, 'GET', null, secretKey);
    const member = memberResult.data;

    // Step 3: Extract and return relevant info
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        email: member.auth?.email || '',
        name: member.customFields?.firstName || member.customFields?.name || '',
        plans: (member.planConnections || []).map(p => ({
          planName: p.planName || p.planId,
          status: p.status
        }))
      })
    };
  } catch (error) {
    console.error('Memberstack API error:', error);
    if (error.statusCode === 401) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch member info' })
    };
  }
}

exports.handler = async (event) => {
    // Route based on path
    const path = event.path || '/multiply';

    if (path === '/member-info') {
        return handleMemberInfo(event);
    }

    // Original multiply logic continues below...
    try {
        // Parse the request body
        const body = JSON.parse(event.body || '{}');

        // Validate input
        if (!body.hasOwnProperty('number')) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required field: number'
                })
            };
        }

        const number = parseFloat(body.number);

        // Validate that it's a valid number
        if (isNaN(number)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Invalid number provided'
                })
            };
        }

        // Multiply by 3
        const result = number * 3;

        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                input: number,
                result: result
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};
