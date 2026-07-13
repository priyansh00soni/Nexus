<div align="center">

# ⚡ NEXUS

### Multi-Tenant, Multi-Channel Notification Delivery Infrastructure

**At-least-once delivery. Idempotent by design. Rate-limited per tenant. Fully observable.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queue-FF6B6B?style=flat-square)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboard-F46800?style=flat-square&logo=grafana&logoColor=white)](https://grafana.com/)
[![CI](https://img.shields.io/github/actions/workflow/status/priyansh00soni/Nexus/ci.yml?branch=main&style=flat-square&label=CI&logo=github)](https://github.com/priyansh00soni/Nexus/actions)
[![OpenAPI](https://img.shields.io/badge/API%20Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://nexus-api-ci20.onrender.com/api/v1/api-docs)
[![Live on Render](https://img.shields.io/badge/Live-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://nexus-api-ci20.onrender.com/api/v1/monitoring/health)

**[🚀 Live API](https://nexus-api-ci20.onrender.com) · [📊 Health Check](https://nexus-api-ci20.onrender.com/api/v1/monitoring/) · [📘 Swagger Docs](https://nexus-api-ci20.onrender.com/api/v1/api-docs)**

</div>

---

## What is Nexus?

Nexus is a standalone notification service that businesses call over an API to deliver notifications to their users across **Email, In-App, and Webhook** channels, without ever touching a mail provider's SDK or a retry loop themselves. It exists because notification delivery is not a feature you bolt onto a service, it's infrastructure, with the same correctness requirements as a payments system: a request must never be silently dropped, and it must never be processed twice. A company like Swiggy, Razorpay, or Groww doesn't want its order service to go down because Resend had a bad afternoon; Nexus is the isolation layer that makes that impossible.

<div align="center">

https://github.com/user-attachments/assets/ffc2f3a7-e4a8-4e22-b034-19e223e27a37

</div>

---

## The Problem

Every company that sends a user a "your order is confirmed" email, an in-app alert, or a server-to-server webhook eventually hits the same three failure modes if notification logic lives inside the business service itself:

**1. Tight coupling kills reliability.** Bury `resend.emails.send()` inside your order-placement code, and the day your email provider has an outage, your order service has an outage too, for a concern that has nothing to do with placing orders.

**2. Synchronous delivery destroys latency.** External providers are slow, occasionally unreachable, and entirely outside your control. Making a user's HTTP request wait on that round trip is an unforced error.

**3. Network retries create duplicates and this is the one that actually breaks production.** A client times out, retries the same logical request, and a naive system processes it twice: the user gets two "Order Confirmed" emails, delivery metrics are corrupted, and the database eats double the write load. Solving this correctly, at the database level, is the hardest part of this entire system and the part most side projects skip.

Nexus solves all three by being a dedicated, decoupled service: tenants register, get an API key, and send notifications through Nexus without ever thinking about delivery, duplication, or provider outages again.

---

## Architecture

````mermaid
flowchart TD
    A["Client<br/>POST /api/v1/notification<br/>x-api-key + Idempotency-Key"] --> B[Correlation ID]
    B --> C[Auth: hash key → tenant]
    C --> D[Zod validation]
    D --> E["Idempotency<br/>Redis → Postgres fallback"]
    E --> F["Rate limit<br/>sliding window, Redis sorted set"]
    F --> G["Controller<br/>save Notification: PROCESSING"]
    G -->|201, non-blocking| A
    G --> H{channel}
    H -->|EMAIL| Q1[Email Queue]
    H -->|INAPP| Q2[In-App Queue]
    H -->|WEBHOOK| Q3[Webhook Queue]
 
    Q1 & Q2 & Q3 --> W["worker-1 / worker-2 / worker-3<br/>BullMQ Redis job locking"]
    W -->|success| DB[("PostgreSQL<br/>status: COMPLETED")]
    W -->|failure| R["Custom backoff<br/>1s→2s→4s→8s→16s (cap 30s)"]
    R -->|3 attempts exhausted| DLQ[Dead Letter Queue]
 
    W --> M["/metrics ×3<br/>ports 9101/9102/9103"]
    G --> M2["/metrics<br/>API process — queue_depth"]
    M & M2 --> P[Prometheus scrape + sum]
    P --> GR[Grafana dashboards]
````

```
Client → POST /api/v1/notification (with x-api-key + Idempotency-Key)
           │
           ▼
    ┌─────────────────────────────────────────────────────────┐
    │                   MIDDLEWARE CHAIN                      │
    │                                                         │ 
    │  1. Correlation ID  →  UUID stamped on every log        │
    │  2. Auth            →  Hash key → lookup tenant         │
    │  3. Zod Validate    →  Reject malformed before Redis    │
    │  4. Idempotency     →  Redis first → Postgres fallback  │
    │  5. Rate Limit      →  Sliding window (Redis sorted set)│
    └─────────────────────────────────────────────────────────┘
           │
           ▼
    Controller → Save to PostgreSQL (status: PROCESSING)
           │
           ▼
    Enqueue job to BullMQ (email / inapp / webhook queue)
           │
           ▼
    API responds 201 immediately ← non-blocking, fast
           │
           ▼
    ┌────────────────────────────────────────────────────────┐
    │              WORKER LAYER (3 containers)               │
    │                                                        │
    │  worker-1 ──┐                                          │
    │  worker-2 ──┼──► Pick job → Send → Record attempt      │
    │  worker-3 ──┘         │                                │
    │                       ▼                                │
    │              Retry with custom exponential backoff     │
    │              1s → 2s → 4s → 8s → 16s (capped at 30s)   │
    │                       │                                │
    │              After 3 attempts → Dead Letter Queue      │
    └────────────────────────────────────────────────────────┘
           │
           ▼
    Prometheus scrapes /metrics from API + all 3 workers
           │
           ▼
    Grafana dashboards → queue depth, delivery latency, error rates
```

### The Three Channels

| Channel | What it does | Who receives it |
|---|---|---|
| **EMAIL** | Sent via the Resend SDK | End user's inbox |
| **IN-APP** | Persisted in Postgres, served to the tenant's frontend | End user's app UI |
| **WEBHOOK** | HTTP POST to the tenant's registered URL | Tenant's own backend: server-to-server, no human involved |

---

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 20 | Async I/O model fits a workload that's mostly "wait on network, then respond" |
| **Language** | TypeScript | A typo like `"emal"` in a channel enum is a compile error, not a 2am incident. Every payload, queue job, and DB row is a checked type, not a hopeful `any` |
| **Framework** | Express | Unopinionated: full control over exact middleware ordering, which matters when idempotency has to run *before* rate limiting (see below) |
| **Database** | PostgreSQL | Notifications belong to tenants, delivery attempts belong to notifications, idempotency keys are unique per tenant   these are foreign-key relationships with ACID guarantees, not documents. MongoDB was considered and rejected for exactly this reason |
| **ORM** | Prisma | Raw SQL strings can't be type-checked. Prisma generates types straight from the schema, so a bad query fails to compile instead of failing at 2am in production |
| **Cache / Queue Backend** | Redis | In-memory, ~100,000x faster than disk. Backs three independent subsystems: BullMQ's queue state, idempotency key caching, and the sliding-window rate limiter |
| **Queue Library** | BullMQ | Redis-backed job locking, retries, delayed jobs, and a dead-letter queue out of the box. Rebuilding this by hand risks the exact duplicate-delivery bug this whole project exists to prevent |
| **Validation** | Zod | Every payload is validated before it touches Redis or Postgres: malformed requests die at the edge, not three layers deep |
| **Email Provider** | Resend | Clean SDK, minimal integration surface |
| **Logging** | Winston | `console.log` doesn't thread a correlation ID through structured JSON that a log aggregator can query. Winston does   every line across every process is traceable to one request |
| **Metrics** | Prometheus (`prom-client`) | Pull-based scraping across three independent worker processes without needing them to know about each other |
| **Dashboards** | Grafana | Turns raw Prometheus series into the same P95-latency and queue-depth views an on-call engineer actually looks at |
| **Containers** | Docker + Docker Compose | Enforces a Linux filesystem locally: this is the difference between catching a case-sensitivity bug on a laptop and catching it in production (see the war stories below) |
| **Testing** | Vitest | Unit tests for the pieces where correctness is not optional, the backoff formula and template rendering |
| **CI** | GitHub Actions | Every push runs a full typecheck (`tsc --noEmit`) and the test suite, a broken build never silently reaches `main` |
| **API Docs** | Swagger / OpenAPI | Every route is documented from JSDoc annotations and served live at `/api/v1/api-docs` , not a stale Postman collection someone forgot to update |
| **Deployment** | Render | Managed Postgres + Redis, zero infra babysitting for a solo-built project |

---

## Key Engineering Decisions

### 1. PostgreSQL over MongoDB
The schema is relational, not document-shaped: notifications belong to tenants, delivery attempts belong to notifications, and idempotency keys must be unique per tenant. Foreign keys enforce that integrity at the database level regardless of application bugs, and ACID guarantees mean a worker that crashes mid-write never leaves half-committed state. MongoDB was explicitly considered and rejected.

### 2. A queue, not synchronous delivery
Calling Resend's API inside the HTTP request cycle means the client waits on a third-party network call, a provider outage becomes an API outage, and there's no retry path, one failure is permanent. BullMQ decouples "accept the request" from "do the work": the API responds in milliseconds, and delivery with retries happens invisibly to the client.

### 3. Three separate queues, not one shared queue
If email, in-app, and webhook jobs shared a single queue and Resend went down, failing email jobs would pile up with backoff delays and block webhook and in-app jobs behind them  classic head-of-line blocking. Three independent queues mean a broken email provider has zero effect on the other two channels, and each channel's health is observable on its own.

### 4. Three worker containers, not one
BullMQ's Redis-based job locking guarantees no two workers can grab the same job, exactly-once processing regardless of how many workers are running. Three containers give 3x throughput and fault isolation: if one crashes, two keep processing. Workers scale independently of the API, with zero code changes.

### 5. Idempotency runs before rate limiting in the middleware chain
A client retrying after a network timeout is resending the *same logical request* that retry should never cost the tenant a slot in their rate limit. Run rate limiting first, and a tenant with flaky network conditions burns their quota purely on retries of requests that already succeeded. Idempotency catches duplicates first; only genuinely new requests reach the limiter.

### 6. Sliding window rate limiting, not fixed window
Fixed windows have a boundary exploit: 100 requests at second 59 and 100 more at second 61 is 200 requests inside a 2-second span, invisible to a limiter that just resets a counter every 60 seconds. Nexus implements a sliding window with a Redis sorted set  timestamps as scores. `ZREMRANGEBYSCORE` evicts anything older than the window, `ZCARD` counts what's left, `ZADD` records the new request. At any instant, looking back 60 seconds, the count is exact atomic, and shared correctly across every API instance.

### 7. A custom BullMQ backoff function, not the built-in one
BullMQ's default exponential backoff has no ceiling a persistently failing job can end up retrying hours later. Nexus overrides it with `Math.min(1000 * 2^attemptsMade, 30000)`, producing delays of `1s → 2s → 4s → 8s → 16s`, hard-capped at 30 seconds. After 3 attempts the job moves to BullMQ's failed set, functioning as the dead letter queue.

### 8. API keys are hashed with SHA-256; the raw key is never stored
The raw key is shown exactly once, at tenant creation, then discarded server-side only its hash lives in the database, the same pattern used for passwords. If the database is ever breached, no usable key is exposed.

### 9. `channel` lives on `Notification`, not `Template`
The original schema put `channel` on `Template`. The flaw: a notification needs its channel to route to the correct BullMQ queue, and if that lived on the template, the service would need an extra DB round trip mid-request just to read it back. Channel is a property of the *send*, not the *content*   the same "Welcome" template can legitimately go out as an email in one call and an in-app notification in another. It was moved to `Notification`.

### 10. One `/metrics` endpoint per worker, not a shared one
Each of the three worker containers is a separate Node.js process with separate memory metrics genuinely cannot be shared between them. Each exposes its own `/metrics` (mapped to host ports 9101/9102/9103), and Prometheus scrapes all three and aggregates with `sum()` at query time. `queue_depth` is deliberately reported by the API process only if all three workers also reported it, Prometheus would sum it to 3x the real value.

### 11. TypeScript across the entire codebase
A notification service moves data through five different systems on the way to delivery HTTP body, Postgres row, Redis cache entry, BullMQ job payload, Prisma-typed query result. A silent shape mismatch at any one of those boundaries either drops a notification or duplicates one. TypeScript makes every one of those boundaries a compile-time check instead of a runtime surprise.

### 12. Zod validation before anything touches Redis or Postgres
Validation sits immediately after auth and before idempotency, so a malformed payload never reaches the idempotency check, never writes a Redis key, and never opens a database round trip. Rejecting garbage input is cheap; rejecting it *early* is what keeps Redis and Postgres doing useful work under load.

### 13. Winston over `console.log`
`console.log` gives you unstructured text that's unsearchable at scale and impossible to thread a request through once it crosses into worker processes. Winston emits structured JSON with the correlation ID attached to every line, so a single failed delivery can be traced end-to-end   API middleware, controller, queue enqueue, worker pickup, send attempt by searching one ID.

### 14. Developing inside Docker, not just deploying with it
macOS and Windows have case-insensitive filesystems by default; Linux what Render actually runs does not. Docker Compose locally runs the same Linux filesystem as production, which means a casing bug surfaces on a laptop instead of in a deploy log. This is not a hypothetical see below.

---

## Production Bugs I Actually Fixed


### The Prometheus scraping problem that came from `replicas: 3`

**Symptom:** three worker containers were running and processing jobs correctly, but Prometheus only ever showed metrics from one of them   never all three, and never consistently the same one.

**Root cause:** Docker Compose's `deploy: replicas: 3` shortcut creates three *anonymous* containers behind one service name. They're identical and interchangeable from Compose's point of view   which is exactly the problem, because Prometheus needs a distinct address per target to scrape. It was hitting whichever container the network happened to route to at that moment and calling it done.

**Fix:** replaced the replica shortcut with three explicitly named services   `worker-1`, `worker-2`, `worker-3`   each bound to its own host port (`9101`, `9102`, `9103`), and updated the Prometheus scrape config to list all three targets by name. Each worker's metrics are now individually addressable, and `sum()` at query time gives the real aggregate instead of a lucky guess.

### The idempotency race condition that application logic alone can't close

**The scenario:** a client's request times out and it retries but the retry lands *before* the first request has finished writing its idempotency record. Both requests hit the Redis check simultaneously, both find nothing (correct, nothing's been written yet), and both proceed to process the notification. Two "Order Confirmed" emails go out. The Redis-first check didn't lie   it was accurate at the exact instant it ran; the failure is in the gap between check and write.

**Why the obvious fix doesn't work:** adding an application-level "check, then write" guard doesn't close the window   it's still two separate operations, and two concurrent requests can both pass the check before either completes the write. This has to be enforced somewhere that can't race with itself.

**Fix:** a `@@unique([idempotency_key, tenant_id])` constraint at the Postgres level. Both requests race to `INSERT` an `IdempotencyRecord`; Postgres guarantees only one succeeds, and the second gets a constraint violation  which the middleware catches and treats as a duplicate. The database, not application code, is the source of truth for "has this request already started."

---

## Idempotency, in Detail

Every write request carries an `Idempotency-Key` header. On arrival:

1. **Redis check (fast path).** Key found and the body hash matches → the cached response is returned immediately, no database touch.
2. **Body hash mismatch, same key.** → `409 Conflict`. The client is reusing a key for a genuinely different request; it needs a new one.
3. **PostgreSQL check (fallback).** Redis miss → check the source of truth. If a record already exists and is still `PROCESSING`, the duplicate is rejected with a `409` rather than double-processed.
4. **New request.** Not found anywhere → an `IdempotencyRecord` row is created first, *then* the notification is queued. The race between two simultaneous first-time requests is closed by the `@@unique([idempotency_key, tenant_id])` constraint described above   not by application logic.

---

## Observability

<img width="1442" height="896" alt="nexus-grafana" src="https://github.com/user-attachments/assets/6ab08187-068c-4664-b211-ed0bdbf0a6c5" />

### Metrics Collected

| Metric | Type | What it tells you |
|---|---|---|
| `notifications_sent_total` | Counter | Total deliveries per channel and tenant |
| `notifications_failed_total` | Counter | Failures per channel and tenant |
| `notification_delivery_duration_seconds` | Histogram | Delivery latency distribution |
| `queue_depth` | Gauge | Jobs currently waiting, per queue (reported by the API process only) |

### Dashboard Queries

```promql
# P95 delivery latency
histogram_quantile(0.95, sum(rate(notification_delivery_duration_seconds_bucket[5m])) by (le, channel))

# Error rate per channel
sum(rate(notifications_failed_total[5m])) by (channel)

# Queue depth   the primary scaling signal
queue_depth
```

A rising `queue_depth` means "spin up more workers." A `notifications_failed_total` spike isolated to one channel means "that channel's provider is down"   without touching the other two. These are answered by a live dashboard, not a guess.

---

## Database Schema

<img width="973" height="812" alt="db schmea" src="https://github.com/user-attachments/assets/97feb41a-b6fe-40ee-9924-4b72b3eb167a" />


```prisma
model Tenant {
  id                  String              @id @default(uuid())
  name                String
  from_email          String?
  api_keys            ApiKey[]
  notifications       Notification[]
  templates           Template[]
  idempotency_records IdempotencyRecord[]
}

model ApiKey {
  id        String  @id @default(uuid())
  key_hash  String  @unique   // raw key is never persisted
  tenant_id String
  tenant    Tenant  @relation(fields: [tenant_id], references: [id])
}

enum Channel { WEBHOOK  INAPP  EMAIL }

model Notification {
  id                String             @id @default(uuid())
  channel           Channel            // lives here, not on Template   see decision #9
  tenant_id         String
  status            NotificationStatus // PROCESSING | COMPLETED | FAILED | SCHEDULED
  attempts          Int                @default(0)
  message           String?
  subject           String?
  template_id       String?
  recipient         String
  variables         Json?
  scheduledFor      DateTime?
  delivery_attempts DeliveryAttempt[]

  @@index([tenant_id])
  @@index([status])
  @@index([created_at])
}

model IdempotencyRecord {
  idempotency_key String
  request_hash    String
  response_body   Json?
  status          IdempotencyStatus  // PROCESSING | COMPLETED | FAILED
  tenant_id       String

  @@unique([idempotency_key, tenant_id])  // DB-level race protection, see the war story above
}

model DeliveryAttempt {
  id              String                @id @default(uuid())
  notification_id String
  status          DeliveryAttemptStatus // PROCESSING | COMPLETED | FAILED
  error_message   String?

  @@index([notification_id])
}
```

`DeliveryAttempt` exists specifically so a notification's full retry history   every attempt, its status, and its error   is queryable after the fact, instead of only ever knowing the final outcome.

---

## Performance

<img width="704" height="824" alt="nexus-k6" src="https://github.com/user-attachments/assets/3dcb3273-2932-41cd-9c9a-19a9fbed91dd" />


The load test (`k6/load-test.js`) ramps from 0 to 200 concurrent virtual users over two minutes and holds there, posting notifications against the live `/api/v1/notification` endpoint with a unique idempotency key per request, against thresholds of **p95 latency under 3s** and **error rate under 1%**. Run it yourself:

```bash
k6 run k6/load-test.js
```

*Run the test and drop the actual p95/p99 latency, throughput, and error rate here before sending this README to anyone   a number you can point to beats an adjective every time.*

---

## Known Limitations

Being upfront about the gaps is part of the engineering, not a weakness in it:

- **No Outbox pattern yet.** A worker sends the email, then updates the notification's status to `COMPLETED` in a separate DB write. If the worker crashes in that exact gap, the notification was delivered but its status stays `PROCESSING` forever. The correct fix is the Outbox pattern  making the send confirmation and the DB write part of one atomic transaction. Documented, not yet implemented.
---

## Local Setup

```bash
git clone https://github.com/priyansh00soni/Nexus
cd Nexus
cp .env.example .env
# fill in DATABASE_URL, REDIS_URL / REDIS_PASSWORD, RESEND_API_KEY
docker-compose up -d
npx prisma migrate deploy
npm run dev
```

| Service | URL |
|---|---|
| API | `http://localhost:8000` |
| Swagger / OpenAPI docs | `http://localhost:8000/api/v1/api-docs` |
| Prometheus | `http://localhost:9090` |
| Grafana | `http://localhost:3000` |
| Worker metrics | `http://localhost:9101/metrics` · `9102` · `9103` |

Run the test suite and typecheck exactly as CI does:

```bash
npx tsc --noEmit
npm run test
```

---

## API Reference

Full request/response schemas are live at SwaggerUi : [`/api/v1/api-docs`](https://nexus-api-ci20.onrender.com/api/v1/api-docs). Summary:

<img width="1476" height="953" alt="swagger" src="https://github.com/user-attachments/assets/ea1af66a-55ec-4c93-82d3-bcd0f6f49239" />


| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/v1/tenant` | POST |   | Creates a tenant, returns the raw API key **once** |
| `/api/v1/template` | POST | API key | Create a reusable message template |
| `/api/v1/template/:id` | GET / PATCH / DELETE | API key | Tenant-scoped template CRUD |
| `/api/v1/notification` | POST | API key + `Idempotency-Key` | Create/enqueue a notification (raw message or `template_id`) |
| `/api/v1/notification` | GET | API key | Paginated, filterable list (status, channel, date range) |
| `/api/v1/notification/:id` | GET | API key | Poll delivery status + attempt history |
| `/api/v1/monitoring` | GET |   | Health check   pings Postgres, Redis, and all three queues |
| `/api/v1/monitoring/metrics` | GET |   | Prometheus scrape endpoint |
| `/api/v1/monitoring/dlq` | GET |   | Inspect jobs sitting in each channel's dead letter queue |

### Example: Send a Notification

```bash
curl -X POST https://nexus-api-ci20.onrender.com/api/v1/notification \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Idempotency-Key: order-confirmed-user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "EMAIL",
    "recipient": "user@example.com",
    "subject": "Order Confirmed",
    "message": "Your order #456 has been placed successfully."
  }'
```

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Notification queued successfully.",
  "data": { "notification_id": "uuid", "status": "PROCESSING" }
}
```


## Author

**Priyansh Soni** 

[![GitHub](https://img.shields.io/badge/GitHub-priyansh00soni-181717?style=flat-square&logo=github)](https://github.com/priyansh00soni)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-priyansh00soni-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/priyansh00soni/)

Drop a 🌟 if you found this useful.
</div>
