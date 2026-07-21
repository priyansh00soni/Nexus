import http from 'k6/http';
import { check } from 'k6';

// Usage:
// k6 run -e RATE=50 k6/load-test.js
// k6 run -e RATE=100 k6/load-test.js
// k6 run -e RATE=150 k6/load-test.js

//docker compose -f docker-compose.local.yml up -d --build

const RATE = Number(__ENV.RATE || 100);

http.setResponseCallback(http.expectedStatuses(201, 429));

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: Math.max(50, RATE),
      maxVUs: Math.max(300, RATE * 2),
    },
  },
  thresholds: {
    http_req_duration: [
      'p(95)<800',
      'p(99)<1500',
    ],
    http_req_failed: [
      'rate<0.01',
    ],
    checks: [
      'rate>0.99',
    ],
  },
};

export default function () {
  const res = http.post(
    'http://localhost:8000/api/v1/notification',
    JSON.stringify({
      recipient: 'test@example.com',
      channel: 'INAPP',
      message: 'Load test',
      subject: 'k6 Test',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':
          'd209557dec95bb0b1ada7d2fef45d831e77475c67d83f350803409a5a4adc67b',
        'idempotency-key': crypto.randomUUID(),
      },
      timeout: '30s',
    }
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
  });
}