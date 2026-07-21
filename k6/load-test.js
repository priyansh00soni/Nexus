import http from 'k6/http';
import { check } from 'k6';

// local build - docker compose -f docker-compose.local.yml up -d --build
// k6 run k6/load-test.js

// 429 = rate limiter doing its job, don't count it as a failure in http_req_failed
http.setResponseCallback(http.expectedStatuses(201, 429));

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-arrival-rate',
      rate: 200,              // 200 requests per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 100,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'], 
    checks: ['rate>0.99'],
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
        'x-api-key': 'd209557dec95bb0b1ada7d2fef45d831e77475c67d83f350803409a5a4adc67b',
        'idempotency-key': Math.random().toString(36).substring(2),
      },
      timeout: '30s',
    }
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
  });
}
