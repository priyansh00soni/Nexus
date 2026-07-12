import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp up to 50 users
    { duration: '1m', target: 200 },   // ramp up to 200 users
    { duration: '1m', target: 200 },   // hold at 200 users
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  }
}

export default function () {
    
    const res = http.post('http://localhost:8000/api/v1/notification',
    JSON.stringify({
      recipient: 'test@example.com',
      channel: 'INAPP',
      message: 'Load test',
      subject: 'k6 Test'
    }),
    { headers: {
        'Content-Type': 'application/json',
        'x-api-key': '25f484521f6aed4f4068696d8fdc0a773b26e11e2d1fa4cb34b8bba02ead505c',
        'idempotency-key':Math.random().toString(36).substring(2)
      },
      timeout: '30s'
    }
         
  )
  

  check(res, {
    'status is 201': (r) => r.status === 201,
  })


    sleep(1);
}