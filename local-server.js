/**
 * Local development server that simulates API Gateway + Lambda
 * Allows testing the backend locally without deploying to AWS
 *
 * Usage:
 *   npm run backend    - Start local server on http://localhost:3001
 *   npm run debug      - Start with Node debugger (set breakpoints in IDE)
 *   npm run local      - Start both backend and frontend
 */

// Load environment variables from .env file
require('dotenv').config();

// Map environment-specific keys to what the Lambda handler expects
// For local development, use the LOCAL keys
if (process.env.CT_MEMBERSTACK_LOCAL_SECRET_KEY && !process.env.MEMBERSTACK_SECRET_KEY) {
  process.env.MEMBERSTACK_SECRET_KEY = process.env.CT_MEMBERSTACK_LOCAL_SECRET_KEY;
}
if (process.env.CT_MEMBERSTACK_LOCAL_PUBLIC_KEY && !process.env.MEMBERSTACK_PUBLIC_KEY) {
  process.env.MEMBERSTACK_PUBLIC_KEY = process.env.CT_MEMBERSTACK_LOCAL_PUBLIC_KEY;
}

const http = require('http');
const url = require('url');
const { handler } = require('./src/lambda/handler');

const PORT = process.env.CT_PORT || process.env.PORT || 3001;
const HOST = process.env.CT_HOST || process.env.HOST || 'localhost';

/**
 * Create a simple HTTP server that simulates API Gateway
 * Converts HTTP requests to Lambda event format
 */
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse request URL and body
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Only handle POST requests to /multiply and /member-info
  if (req.method !== 'POST' || (pathname !== '/multiply' && pathname !== '/member-info')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      // Simulate API Gateway event format
      const event = {
        httpMethod: 'POST',
        path: pathname,  // Use actual pathname instead of hardcoded '/multiply'
        body: body,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''  // Pass Authorization header
        },
      };

      // Call the Lambda handler
      const response = await handler(event);

      // Parse and send response
      const statusCode = response.statusCode || 200;
      const headers = response.headers || { 'Content-Type': 'application/json' };

      res.writeHead(statusCode, headers);
      res.end(response.body);
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

/**
 * Start the server
 */
server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Local API Server Running`);
  console.log(`────────────────────────────`);
  console.log(`URL:  http://${HOST}:${PORT}`);
  console.log(`POST endpoint: http://${HOST}:${PORT}/multiply`);
  console.log(`\n📝 Example request:`);
  console.log(`curl -X POST http://localhost:3001/multiply \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"number": 5}'`);
  console.log(`\n🔍 Debugging: Set breakpoints in src/lambda/handler.js`);
  console.log(`💡 Update public/config.js to use: http://localhost:3001/multiply`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

/**
 * Handle server errors
 */
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`\nTry one of these:`);
    console.error(`  1. Kill the process using port ${PORT}`);
    console.error(`  2. Use a different port: PORT=3002 npm run backend`);
    console.error(`  3. Wait and try again\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped\n');
    process.exit(0);
  });
});
