#!/usr/bin/bash
curl -X POST https://imjd82jn21.execute-api.us-west-2.amazonaws.com/api/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
