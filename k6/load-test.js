import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  vus: 1,
  duration: '5s',
    thresholds: {
    http_req_duration: ['p(95)<500'], 
    http_req_failed: ['rate<0.01'],  
  }
}

export default function () {
    
    const res = http.post('https://nexus-api-ci20.onrender.com/api/v1/notification',
    JSON.stringify({
      recipient: 'test@example.com',
      channel: 'EMAIL',
      message: 'Load test',
      subject: 'k6 Test'
    }),
    { headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'c05f35e13954f39d9e8bf62cd040144c0cf721033b22b3e3a74e0c6a0dc90a29',
        'idempotency-key':Math.random().toString(36).substring(2)
      },
      timeout: '30s'
    }
         
  )
  
  console.log(res.status, res.body)

  check(res, {
    'status is 201': (r) => r.status === 201,
  })


    sleep(1);
}