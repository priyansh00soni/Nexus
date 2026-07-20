import http from 'k6/http';
import { check } from 'k6';

// local build - docker compose -f docker-compose.local.yml up -d --build
// k6 run k6/load-test.js

export const options = {
  stages: [
    { duration: '30s', target: 50 },   
    { duration: '1m', target: 200 }, 
    { duration: '1m', target: 200 },   
    { duration: '30s', target: 0 },   
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
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
    'status is 201 or 429': (r) => r.status === 201 || r.status === 429,
  });
}