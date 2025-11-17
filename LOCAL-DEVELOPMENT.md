# Local Development Guide

This guide explains how to run and debug the multiply service locally without deploying to AWS.

## Quick Start

### 1. Install Dependencies

First time setup:
```bash
npm install
```

This installs:
- `live-server` - Local frontend dev server with auto-refresh
- `nodemon` - Auto-restart backend on file changes
- `concurrently` - Run multiple commands simultaneously

### 2. Run Everything Locally

**Option A: Run backend and frontend together**
```bash
npm run local
```

This starts:
- Frontend: http://localhost:8080 (auto-opens browser)
- Backend: http://localhost:3001 (multiply endpoint)

**Option B: Run them separately (recommended for debugging)**

Terminal 1 - Start backend:
```bash
npm run backend
```

Terminal 2 - Start frontend:
```bash
npm run dev:open
```

### 3. Test the Local Setup

1. Frontend will auto-open at http://localhost:8080
2. Enter a number (e.g., 5)
3. Click "Multiply by 3"
4. You should see the result (15)

✅ Success! You're now running locally!

---

## Frontend Development

### Local Frontend Server

```bash
npm run dev
# Starts on http://localhost:8080 without opening browser

npm run dev:open
# Starts on http://localhost:8080 and opens browser automatically
```

### Features

- **Auto-refresh**: Browser automatically reloads when you edit files
- **Live reload**: Just save your file and see changes instantly
- **No build step**: Plain HTML/CSS/JavaScript

### Example Workflow

1. Start frontend: `npm run dev:open`
2. Edit `public/index.html` or `public/styles.css`
3. Save file
4. Browser auto-refreshes (you'll see the changes)

### API Endpoint Selection

The frontend **automatically detects** which backend to use:

- **Local backend** (http://localhost:8080): Uses http://localhost:3001/multiply
- **Deployed backend** (https://cloudfront...): Uses AWS API Gateway

This is configured in `public/config.js`.

---

## Backend Debugging

### Run Local Backend Server

```bash
npm run backend
```

Output:
```
🚀 Local API Server Running
────────────────────────────
URL:  http://localhost:3001
POST endpoint: http://localhost:3001/multiply

Example request:
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
```

### Debug with Breakpoints (VS Code)

The best way to debug is with breakpoints in VS Code.

#### Setup (one-time):

1. Open VS Code
2. Make sure you have Node.js debugging extension installed (included by default)

#### Debug Session:

1. Open `src/lambda/handler.js`
2. Click on a line number to set a breakpoint
3. Open "Run and Debug" (Ctrl+Shift+D)
4. Select "Debug Local Backend" from dropdown
5. Click green play button
6. Make a request to http://localhost:3001/multiply
7. Execution will pause at your breakpoint

#### Using the Debugger

- **Step Over** (F10): Execute next line
- **Step Into** (F11): Enter function calls
- **Step Out** (Shift+F11): Exit current function
- **Continue** (F5): Resume execution
- **Hover variables**: See their current values
- **Watch expressions**: Monitor specific variables

### Manual Testing

Test the backend with curl:

```bash
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'

# Response:
# {"input":5,"result":15}
```

Test with invalid input:

```bash
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{}'

# Response:
# {"error":"Missing required field: number"}
```

### Run Unit Tests

```bash
npm test
# Runs test-local.js with 6 test cases
```

Watch mode (auto-run tests when files change):

```bash
npm run test:watch
# Requires nodemon to be installed
```

---

## Full Local Development Workflow

### Scenario: Fix a Bug in the Lambda Handler

1. **Start everything:**
   ```bash
   npm run local
   # Opens frontend at localhost:8080 with backend running
   ```

2. **Identify the issue** in the frontend (e.g., wrong calculation)

3. **Open the handler in VS Code:**
   - File: `src/lambda/handler.js`

4. **Set a breakpoint:**
   - Click on a line number to set breakpoint (red dot appears)

5. **Debug mode:**
   ```bash
   # In VS Code: Run → Start Debugging (Ctrl+Shift+D)
   # Select "Debug Local Backend"
   ```

6. **Reproduce the issue:**
   - Go to http://localhost:8080
   - Enter a number
   - Click "Multiply by 3"

7. **Step through execution:**
   - Code will pause at your breakpoint
   - Use F10/F11 to step through
   - Hover over variables to see values

8. **Fix the bug:**
   - Exit debugger (Shift+F5)
   - Edit the handler code
   - Save file

9. **Verify fix:**
   - Re-run the test in frontend
   - Or use: `npm test`

---

## Switching Between Local and Deployed Backends

### Auto-Switching (Recommended)

The app automatically detects the environment:

```javascript
// config.js logic:
if (localhost) {
  use http://localhost:3001/multiply  // Local backend
} else {
  use https://d2ohaeiivgnrqq...       // Deployed (CloudFront/AWS)
}
```

### Manual Switching

If auto-detection doesn't work:

1. **For local backend:**
   ```bash
   npm run local
   # Visit http://localhost:8080
   # Will automatically use http://localhost:3001
   ```

2. **For deployed backend:**
   ```bash
   # Visit your CloudFront URL
   # https://d2ohaeiivgnrqq.cloudfront.net
   # Will automatically use AWS API
   ```

---

## Troubleshooting

### "Port 3001 already in use"

```bash
# Solution 1: Use a different port
PORT=3002 npm run backend

# Solution 2: Kill the process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

### "Cannot GET /multiply"

Frontend is trying to access the endpoint incorrectly.

**Check:**
1. Backend is running: `npm run backend`
2. Frontend shows correct endpoint in console
3. Open DevTools (F12) → Console tab
4. You should see: "🔧 API Configuration: Endpoint: http://localhost:3001/multiply"

### Frontend doesn't auto-refresh

live-server should watch for file changes. If it doesn't:

1. Close and restart: `npm run dev:open`
2. Check file permissions (Windows sometimes locks files)
3. Try saving to a different file and back

### "Cannot find module" errors

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend not accepting requests from frontend

Check CORS headers in `local-server.js`. They should allow all origins for local dev.

Test directly with curl to isolate the issue:

```bash
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
```

If curl works but frontend doesn't, it's a CORS issue in the frontend code.

---

## Performance & Optimization Tips

### Watch Mode for Tests

Instead of running `npm test` each time:

```bash
npm run test:watch
# Auto-runs tests when src/lambda/handler.js changes
```

### Auto-Restart Backend

If you edit `local-server.js` or `src/lambda/handler.js`, you need to restart the backend.

With `nodemon` installed:
```bash
# Automatically restarts when you save
npx nodemon local-server.js
```

### VS Code Extensions

Recommended extensions for better development:

1. **ES7+ React/Redux/React-Native snippets** - Faster coding
2. **Prettier** - Auto-format code
3. **Thunder Client** or **REST Client** - Test APIs directly in VS Code
4. **AWS Toolkit** - AWS integration

---

## Deploying After Local Development

When you're ready to deploy your changes to AWS:

```bash
# Deploy to AWS
npm run deploy

# This will:
# - Update Lambda function with new handler code
# - Update frontend files in S3
# - Invalidate CloudFront cache
# - Restart the API
```

Your deployed version will be live in 1-2 minutes (cache invalidation time).

---

## Project Structure for Development

```
.
├── src/
│   └── lambda/
│       └── handler.js          ← Edit backend logic here
├── public/
│   ├── index.html              ← Edit frontend HTML here
│   ├── styles.css              ← Edit styling here
│   ├── app.js                  ← Edit frontend JS here
│   └── config.js               ← API endpoint config
├── local-server.js             ← Local backend server
├── test-local.js               ← Backend unit tests
├── .vscode/
│   └── launch.json             ← Debugger config
└── package.json                ← NPM scripts
```

---

## Tips & Best Practices

1. **Always run tests before deploying:**
   ```bash
   npm test
   ```

2. **Use debugging for complex issues:**
   - It's faster than console.log debugging
   - Set breakpoints, inspect variables, step through code

3. **Test locally first:**
   - Run locally to catch issues before AWS deployment
   - Saves time and AWS costs

4. **Keep frontend and backend in sync:**
   - If you update the API response format, update frontend too
   - Test the integration locally first

5. **Use meaningful error messages:**
   - Good error messages help you debug faster
   - Include context about what went wrong

---

## Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) to learn about deploying to AWS
- Read [RATE-LIMITING.md](RATE-LIMITING.md) to understand API throttling
- Read [HTTPS-MIGRATION.md](HTTPS-MIGRATION.md) for deployment architecture
