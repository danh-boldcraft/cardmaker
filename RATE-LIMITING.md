# Rate Limiting Recommendations

## Overview
Rate limiting protects your API from abuse, controls AWS costs, and ensures service availability. Here are recommended approaches ranked by ease of implementation.

---

## Option 1: API Gateway Throttling ⭐ RECOMMENDED

**Best for:** Most use cases, cost-effective, easy to implement

### What it does:
- Limits requests per second across your entire API or per method
- Returns HTTP 429 (Too Many Requests) when limit exceeded
- Built into API Gateway - no extra cost
- Protects Lambda from excessive invocations

### Recommended Limits:
```javascript
// Default for entire API
throttle: {
  rateLimit: 100,      // 100 requests per second
  burstLimit: 200      // Allow bursts up to 200 requests
}

// Per-method override for /multiply endpoint
throttle: {
  rateLimit: 10,       // 10 requests per second per user
  burstLimit: 20       // Burst up to 20 requests
}
```

### Implementation:
Add to your CDK stack (`lib/multiply-stack.js`):

```javascript
// Update the API Gateway configuration
const api = new apigateway.RestApi(this, 'MultiplyApi', {
  restApiName: 'Multiply Service',
  description: 'API for multiplying numbers by 3',
  deployOptions: {
    stageName: 'prod',
    // Global throttling for the entire API
    throttlingRateLimit: 100,      // requests per second
    throttlingBurstLimit: 200      // burst capacity
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'Authorization']
  }
});

// Add method-specific throttling to the POST /multiply endpoint
multiplyResource.addMethod('POST', lambdaIntegration, {
  throttling: {
    rateLimit: 10,    // 10 requests per second
    burstLimit: 20    // burst up to 20
  }
});
```

### Cost: FREE (included with API Gateway)

---

## Option 2: AWS WAF with Rate-Based Rules

**Best for:** Advanced protection, DDoS prevention, IP-based blocking

### What it does:
- Rate limiting per IP address
- Block malicious IPs automatically
- Advanced rules (geography, headers, etc.)
- Integrates with CloudWatch for monitoring

### Recommended Configuration:
```javascript
// Rate limit: 2,000 requests per 5 minutes per IP
const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  rules: [{
    name: 'RateLimitRule',
    priority: 1,
    statement: {
      rateBasedStatement: {
        limit: 2000,                    // 2000 requests per 5 min
        aggregateKeyType: 'IP'          // Track per IP address
      }
    },
    action: { block: {} },              // Block when exceeded
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'RateLimitRule'
    }
  }]
});
```

### Cost: ~$5/month + $0.60 per million requests

---

## Option 3: Usage Plans & API Keys

**Best for:** Different tiers for different users, monetization

### What it does:
- Issue API keys to users
- Different rate limits per tier (free, premium, enterprise)
- Track usage per customer
- Enforce quotas (daily/monthly limits)

### Example Tiers:
```javascript
// Free Tier
const freePlan = new apigateway.UsagePlan(this, 'FreePlan', {
  name: 'Free Tier',
  throttle: {
    rateLimit: 5,       // 5 requests/sec
    burstLimit: 10
  },
  quota: {
    limit: 1000,        // 1000 requests per day
    period: apigateway.Period.DAY
  }
});

// Premium Tier
const premiumPlan = new apigateway.UsagePlan(this, 'PremiumPlan', {
  name: 'Premium Tier',
  throttle: {
    rateLimit: 50,      // 50 requests/sec
    burstLimit: 100
  },
  quota: {
    limit: 100000,      // 100K requests per day
    period: apigateway.Period.DAY
  }
});

// Associate with API stage
freePlan.addApiStage({
  stage: api.deploymentStage
});
```

### Cost: FREE (included with API Gateway)

---

## Option 4: CloudFront Rate Limiting

**Best for:** Also need CDN, caching, HTTPS, global distribution

### What it does:
- Rate limiting at the edge (CloudFront)
- Caching reduces backend calls
- HTTPS/SSL certificate (free)
- Better performance globally
- Can integrate with WAF

### Benefits:
- Frontend served from CloudFront (faster)
- API requests cached at edge locations
- Automatic HTTPS
- DDoS protection

### Cost:
- CloudFront: ~$0.085 per GB transferred
- SSL Certificate: FREE
- Can add WAF: +$5/month

---

## Option 5: Lambda-Level Rate Limiting

**Best for:** Custom logic, per-user tracking, complex business rules

### What it does:
- Custom rate limiting inside Lambda
- Use DynamoDB to track request counts
- Flexible rules based on any criteria

### Implementation:
```javascript
const DynamoDB = require('aws-sdk/clients/dynamodb');
const docClient = new DynamoDB.DocumentClient();

async function checkRateLimit(userId, limit = 10) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 60; // 1-minute window

  // Get request count from DynamoDB
  const params = {
    TableName: 'RateLimitTable',
    Key: { userId },
    UpdateExpression: 'SET requestCount = if_not_exists(requestCount, :zero) + :inc, lastReset = :now',
    ConditionExpression: 'requestCount < :limit OR lastReset < :windowStart',
    ExpressionAttributeValues: {
      ':zero': 0,
      ':inc': 1,
      ':limit': limit,
      ':now': now,
      ':windowStart': windowStart
    }
  };

  try {
    await docClient.update(params).promise();
    return true; // Allow request
  } catch (err) {
    return false; // Rate limit exceeded
  }
}
```

### Cost:
- DynamoDB: ~$0.25/month for typical usage
- Additional Lambda execution time

---

## Recommended Implementation Strategy

### Phase 1: Start Simple (Do This First) ⭐
**Implement API Gateway throttling** - takes 5 minutes, free, effective

### Phase 2: Add Monitoring
- Enable API Gateway CloudWatch metrics
- Set up alarms for throttling events
- Monitor actual usage patterns

### Phase 3: Scale Up (If Needed)
Based on your usage patterns:
- High traffic from specific IPs? → Add WAF
- Need user tiers? → Add Usage Plans & API Keys
- Need global performance? → Add CloudFront
- Complex business logic? → Add Lambda-level limiting

---

## Quick Implementation (Option 1)

### Step 1: Update CDK Stack
Add throttling to `lib/multiply-stack.js`:

```javascript
// In deployOptions
deployOptions: {
  stageName: 'prod',
  throttlingRateLimit: 100,    // Adjust based on expected traffic
  throttlingBurstLimit: 200
}

// On the POST method
multiplyResource.addMethod('POST', lambdaIntegration, {
  throttling: {
    rateLimit: 10,     // 10 requests/sec - reasonable for a multiply service
    burstLimit: 20     // Allow small bursts
  }
});
```

### Step 2: Update Frontend Error Handling
Add handling for 429 errors in `public/app.js`:

```javascript
if (response.status === 429) {
  showError('Rate limit exceeded. Please wait a moment and try again.');
  return;
}
```

### Step 3: Deploy
```bash
npm run deploy
```

---

## Monitoring Rate Limiting

### CloudWatch Metrics to Monitor:
1. `Count` - Total number of requests
2. `4XXError` - Client errors (including 429)
3. `Throttles` - Number of throttled requests
4. `Latency` - Response time

### Set Up Alarms:
```javascript
const alarm = new cloudwatch.Alarm(this, 'ThrottleAlarm', {
  metric: api.metricClientError(),
  threshold: 100,
  evaluationPeriods: 1,
  alarmDescription: 'Alert when API is being throttled heavily'
});
```

---

## Testing Rate Limiting

After implementing, test with:

```bash
# Send multiple rapid requests
for i in {1..50}; do
  curl -X POST https://YOUR-API-ENDPOINT/prod/multiply \
    -H "Content-Type: application/json" \
    -d '{"number": 5}' &
done
```

You should see some requests return HTTP 429 with:
```json
{"message": "Too Many Requests"}
```

---

## Recommendations Summary

| Use Case | Solution | Cost | Complexity |
|----------|----------|------|------------|
| Basic protection | API Gateway Throttling | FREE | Low ⭐ |
| IP-based limiting | WAF | ~$5/mo | Medium |
| User tiers | Usage Plans | FREE | Medium |
| Global + HTTPS | CloudFront | Variable | High |
| Custom logic | Lambda + DynamoDB | ~$0.25/mo | High |

**Start with API Gateway throttling, then add more as needed.**
