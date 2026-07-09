<div align="center">

# ⚡ NEXUS

### Multi-Channel Tenant Notification Infrastructure

**Nexus is a production-grade, multi-tenant notification delivery platform that lets businesses reliably send notifications to their users via Email, In-App, and Webhook channels — with guaranteed at-least-once delivery, idempotency, rate limiting, exponential backoff, and full observability.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queue-FF6B6B?style=flat-square)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboard-F46800?style=flat-square&logo=grafana&logoColor=white)](https://grafana.com/)
[![Live on Render](https://img.shields.io/badge/Live-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://nexus-api-ci20.onrender.com/api/v1/monitoring/health)

**[🚀 Live API](https://nexus-api-ci20.onrender.com) · [📊 Health Check](https://nexus-api-ci20.onrender.com/api/v1/monitoring/health)**


https://github.com/user-attachments/assets/7694d32e-ec4d-4154-9ccf-648926e55634



</div>

---

## 🧠 The Problem Nexus Solves

Every product company — Swiggy, Razorpay, Groww, PhonePe — has to solve the same internal infrastructure problem: **reliable multi-channel notification delivery at scale**.

The naive solution is to write notification logic directly inside the business service. This breaks in three critical ways:

**1. Tight coupling kills reliability.** If your email provider goes down, your order service goes down with it. A notification failure should never crash the service that triggered it.

**2. Synchronous delivery destroys latency.** Waiting for an email to send before responding to a user is unacceptable. External providers are slow and unreliable. Notification delivery must be async and non-blocking.

**3. Network retries create duplicates.** When a client retries a timed-out request, naive systems process it twice — the user gets two "Order Confirmed" emails, your metrics are corrupted, and your DB takes double the write load. This is the hardest problem to solve correctly.

Nexus is a dedicated notification service that solves all three. Businesses register as tenants, receive an API key, and use Nexus to send notifications to their users across three channels — without ever worrying about delivery, duplication, or loss.

---

## 🏗️ Architecture

### High-Level Request Flow

```
Client → POST /api/v1/notification (with x-api-key + Idempotency-Key)
           │
           ▼
    ┌──────────────────────────────────────────────────────┐
    │                   MIDDLEWARE CHAIN                    │
    │                                                      │
    │  1. Correlation ID  →  UUID stamped on every log     │
    │  2. Auth            →  Hash key → lookup tenant      │
    │  3. Zod Validate    →  Reject malformed before Redis │
    │  4. Idempotency     →  Redis first → Postgres fallback│
    │  5. Rate Limit      →  Sliding window (Redis sorted set)│
    └──────────────────────────────────────────────────────┘
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
    ┌──────────────────────────────────────────────────────┐
    │              WORKER LAYER (3 containers)             │
    │                                                      │
    │  worker-1 ──┐                                        │
    │  worker-2 ──┼──► Pick job → Send → Record attempt   │
    │  worker-3 ──┘         │                             │
    │                       ▼                             │
    │              Retry with exponential backoff          │
    │              2s → 4s → 8s (capped at 30s)           │
    │                       │                             │
    │              After 3 failures → DLQ                 │
    └──────────────────────────────────────────────────────┘
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
| **EMAIL** | Sends via Resend SDK | End user's inbox |
| **IN-APP** | Stored in DB, polled by client | End user's app UI |
| **WEBHOOK** | HTTP POST to tenant's registered URL | Tenant's own backend server |

The webhook channel is purely server-to-server — Swiggy calls Nexus to trigger it, Nexus calls back to Swiggy's own server to confirm the event. No human is involved.

---

## ⚙️ Tech Stack & Rationale

| Component | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 20 | Efficient async I/O; fits notification workloads perfectly |
| **Language** | TypeScript | Compile-time safety — a typo like `"emal"` is caught in the editor, not in production |
| **Framework** | Express | Unopinionated; full control over middleware chain order |
| **Database** | PostgreSQL | Relational data with strict referential integrity. Notifications belong to tenants, delivery attempts belong to notifications — these are relationships that need foreign keys and ACID guarantees. MongoDB was explicitly considered and rejected. |
| **ORM** | Prisma | Type-safe queries. Raw SQL strings are just text — TypeScript can't validate them. Prisma generates types from the schema, making every query a real, checkable expression. |
| **Cache + Queue Backend** | Redis | In-memory, ~100,000x faster than disk. Serves three purposes: BullMQ queue infrastructure, idempotency key caching, and sliding-window rate limiting. |
| **Queue Library** | BullMQ | Production-grade Redis-backed queue. Handles job locking, retries, exponential backoff, delayed jobs, and DLQ. Building this from scratch risks lost or duplicated notifications. |
| **Email Provider** | Resend | Modern SDK, clean integration |
| **Validation** | Zod | Schema validation on all incoming payloads before any Redis or DB touch |
| **Logging** | Winston | Structured JSON logs with correlation ID threading |
| **Metrics** | Prometheus (`prom-client`) | Industry-standard pull-based monitoring |
| **Visualization** | Grafana | Live dashboards on top of Prometheus |
| **Containers** | Docker + Docker Compose | Solves "works on my machine"; enforces Linux file system locally (catching case-sensitivity bugs before production) |
| **Deployment** | Render | Managed Postgres + Redis; free tier |

---

## 🔑 Key Architectural Decisions

### 1. Why PostgreSQL over MongoDB?

The schema is well-defined and relational. Notifications belong to tenants, delivery attempts belong to notifications, idempotency keys must be globally unique per tenant. These are relationships — not documents. ACID guarantees mean a crashed worker mid-write never leaves partial state. Foreign keys enforce referential integrity at the DB level, regardless of application bugs. MongoDB was considered and explicitly rejected.

### 2. Why a Queue? Why Not Synchronous Delivery?

If Nexus called Resend's API synchronously inside the HTTP request cycle:
- The client would wait for delivery before getting a response (slow UX)
- An email provider outage would fail the API response itself
- There would be no retry mechanism — one failure = permanent failure

BullMQ decouples "accepting the request" from "doing the work." The API responds in milliseconds. Workers handle delivery asynchronously, with retries, completely invisible to the client.

### 3. Why Three Separate Queues Instead of One?

**Head-of-line blocking.** If Resend goes down and all three channels share one queue, failing email jobs pile up with exponential backoff delays — and webhook and in-app jobs get stuck behind them. Three separate queues mean a broken email provider has zero impact on webhook or in-app throughput. Each channel's health is observable independently.

### 4. Why Three Worker Containers?

**Parallel processing + fault isolation.** BullMQ uses Redis-based job locking — no two workers can grab the same job, guaranteeing exactly-once processing regardless of concurrency. Three workers means 3x throughput. If one container crashes, two keep processing. Scale up workers independently of the API — no code changes required.

### 5. Why Idempotency Before Rate Limiting in the Middleware Chain?

A client retrying a request due to a network timeout is resending the *same logical request* — it should not consume the tenant's rate limit quota. If rate limiting ran before idempotency, a client with bad network conditions would burn through their quota just from retries. Idempotency catches duplicates first; only genuinely new requests reach the rate limiter.

### 6. Sliding Window Rate Limiting — Not Fixed Window

Fixed window has a boundary exploit: 100 requests at second 59, 100 more at second 61 = 200 requests in a 2-second gap. The window resets without seeing the burst.

Sliding window (implemented via Redis sorted set with timestamps as scores) guarantees that at *any* point in time, looking back 60 seconds, the request count never exceeds the limit. `ZADD` + `ZREMRANGEBYSCORE` + `ZCARD` — atomic, shared across all API instances.

### 7. Custom BullMQ Backoff Strategy — Not the Built-In

BullMQ's built-in exponential backoff has no ceiling. A job that keeps failing could end up retrying after hours. Nexus uses a custom backoff function: `Math.min(1000 * 2^attempt, 30000)` — giving delays of `2s → 4s → 8s`, hard-capped at 30 seconds. After 3 attempts, the job moves to the Dead Letter Queue for manual inspection.

### 8. Why Hash API Keys and Never Store the Raw Key?

The raw API key is shown once at tenant creation and never stored. Only a SHA-256 hash lives in the database. If the database is ever breached, raw keys are never exposed — directly analogous to password hashing. The tenant is the only party that ever possesses the raw key.

### 9. Why `channel` Lives on Notification, Not Template

The original design put `channel` on the Template model. The flaw: a notification needs a channel to route to the correct BullMQ queue. If channel was on the template, the service would need an extra DB round trip mid-processing just to read it back. Channel is a property of the *send* (the notification), not the *content* (the template). The same "Welcome" template can be sent as email or in-app depending on context. Channel was moved to Notification.

### 10. Prometheus Multi-Process Metrics Architecture

Each of the three worker containers is a separate Node.js process with separate memory. Metrics cannot be shared via process memory. Each worker exposes its own `/metrics` endpoint (internal port 9101, mapped to 9101/9102/9103 on the host). Prometheus scrapes all three separately and aggregates with `sum()` at query time.

Queue depth (`queueDepth` gauge) is only reported by the API process. If all three workers also reported it, Prometheus would sum them to 3× the actual value — garbage data. The API is a single instance; no duplication problem.

---

## 🛡️ Production Hardening

### Idempotency — Preventing Duplicate Notifications

Every request includes an `Idempotency-Key` header. On arrival:

1. **Redis check (fast path):** key found → return cached response immediately, no DB touch
2. **PostgreSQL check (fallback):** Redis miss → check source of truth
3. **New request:** not found anywhere → process, store in both Redis and Postgres

**Race condition protection:** two identical requests arriving simultaneously both pass the Redis check (neither has written yet) and race to the DB. A `@@unique([idempotency_key, tenant_id])` constraint at the database level ensures only one INSERT succeeds — the second receives a constraint violation and is handled gracefully. Application logic alone cannot prevent this race.

**Body hash mismatch:** same idempotency key, different request body → `409 Conflict`. Use a different key.

### Dead Letter Queue

After 3 failed delivery attempts with exponential backoff (`2s → 4s → 8s`), jobs are moved to BullMQ's failed job set (DLQ) for manual inspection. This prevents infinite retry loops from hammering a broken provider while preserving the job for recovery.

**Known gap:** a DLQ manual-retry admin endpoint is not yet implemented — jobs in the DLQ currently require direct Redis/BullMQ inspection.

### Correlation ID Tracing

Every request receives a UUID at the very first middleware — before auth, before anything. This ID is attached to every log line throughout the entire request lifecycle, including worker processing. When a delivery fails, search logs by correlation ID to see the complete journey of that one request across API and worker processes.

### Known Limitation — Outbox Pattern

After a worker successfully sends an email, it updates the notification status to `COMPLETED` in a separate DB call. If the worker crashes between send and DB update, the notification was delivered but the status remains `PROCESSING` permanently. The correct solution is the **Outbox pattern** — making the delivery confirmation and DB update part of the same atomic transaction. This is a documented gap, not yet implemented.

---

## 📊 Observability

Nexus ships with a full Prometheus + Grafana observability stack.

### Metrics Collected

| Metric | Type | What it tells you |
|---|---|---|
| `notifications_sent_total` | Counter | Total deliveries per channel and tenant |
| `notifications_failed_total` | Counter | Failures per channel and tenant |
| `notification_delivery_duration_seconds` | Histogram | Delivery latency distribution |
| `queue_depth` | Gauge | Current jobs waiting per queue |

### Key Dashboard Queries

```promql
# P95 delivery latency — "95% of notifications delivered within X ms"
histogram_quantile(0.95, sum(rate(notification_delivery_duration_seconds_bucket[5m])) by (le, channel))

# Error rate per channel
sum(rate(notifications_failed_total[5m])) by (channel)

# Queue depth — primary scaling signal
queue_depth
```

A high `queue_depth` signals: spin up more worker containers. A spiking `notifications_failed_total` for a single channel signals: that channel's provider is down. These questions are answered with a live dashboard, not a claim.

---

## 🗄️ Database Schema

```prisma
model Tenant {
  id          String   @id @default(uuid())
  name        String
  api_keys    ApiKey[]
  notifications Notification[]
  templates   Template[]
  idempotency_records IdempotencyRecord[]
  from_email  String?
}

model ApiKey {
  id        String  @id @default(uuid())
  key_hash  String  @unique   // raw key never stored
  tenant_id String
  tenant    Tenant  @relation(...)
}

enum Channel { WEBHOOK  INAPP  EMAIL }

model Notification {
  id          String             @id @default(uuid())
  channel     Channel            // on Notification, not Template — see Architectural Decisions §9
  tenant_id   String
  status      NotificationStatus
  attempts    Int                @default(0)
  message     String?
  subject     String?
  template_id String?
  recipient   String
  variables   Json?
  scheduledFor DateTime?
  error_message String?
  delivery_attempts DeliveryAttempt[]

  @@index([tenant_id])
  @@index([status])
  @@index([created_at])
}

model IdempotencyRecord {
  idempotency_key String
  request_hash    String
  response_body   Json?
  tenant_id       String

  @@unique([idempotency_key, tenant_id])  // DB-level race condition protection
}
```

---

## 🚀 Local Setup

**Prerequisites:** Docker, Node.js 20+

```bash
# 1. Clone
git clone https://github.com/priyansh00soni/nexus
cd nexus

# 2. Environment
cp .env.example .env
# Fill in: DATABASE_URL, REDIS_URL, RESEND_API_KEY, ADMIN_API_KEY

# 3. Start infrastructure
docker-compose up -d

# 4. Run migrations
npx prisma migrate deploy

# 5. Start API + Workers
npm run dev
```

**Services after startup:**

| Service | URL |
|---|---|
| API | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |
| Grafana | `http://localhost:3001` |
| Worker metrics | `http://localhost:9101/metrics` — `9102` — `9103` |

---

## 📡 API Reference

```
POST   /api/v1/tenant                     Create tenant + API key
POST   /api/v1/template                   Create notification template
GET    /api/v1/template/:id               Fetch template (tenant-scoped)
PATCH  /api/v1/template/:id               Update template
DELETE /api/v1/template/:id               Delete template

POST   /api/v1/notification               Create + enqueue notification
GET    /api/v1/notification/:id           Poll delivery status
GET    /api/v1/notification               List / filter / paginate notifications
GET    /notifications/inapp               Fetch in-app notifications (polling)
PATCH  /notifications/inapp/:id/read      Mark in-app notification read

GET    /api/v1/monitoring/health          DB + Redis liveness
GET    /api/v1/monitoring/metrics         Prometheus scrape endpoint
GET    /api/v1/monitoring/queues          BullMQ queue stats (admin-key protected)
```

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

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Notification queued successfully.",
  "data": {
    "notification_id": "uuid",
    "status": "PROCESSING"
  }
}
```

---

## 🐛 Production Bugs Encountered & Fixed

### Case-Sensitivity Deployment Failure

**Symptom:** application worked locally, crashed on Render with `MODULE_NOT_FOUND`.

**Root cause:** macOS (local) has a case-insensitive file system. An import of `'./PrismaClient'` when the file was named `prismaClient.ts` silently succeeds locally. Linux (Render's runtime) has a case-sensitive file system — the same import throws at startup.

**Fix:** corrected all import paths to match exact file casing. **Lesson:** Docker locally runs Linux and would have caught this before deployment. Always develop in Docker.

### Worker Topology — `replicas: 3` vs Explicit Services

**Original approach:** Docker Compose `deploy: replicas: 3` — gave three anonymous, identical worker containers.

**Problem:** Prometheus cannot scrape anonymous replicas with individual addresses. Each worker needs its own hostname and port for per-process metric collection.

**Fix:** replaced with three explicitly named services (`worker-1`, `worker-2`, `worker-3`), each with its own host port mapping (`9101`, `9102`, `9103`). Prometheus config updated to scrape all three targets.

---

## 🗺️ Roadmap

- [x] Multi-channel delivery (Email, In-App, Webhook)
- [x] BullMQ queue with exponential backoff + DLQ
- [x] Idempotency (Redis + PostgreSQL, race-condition safe)
- [x] Sliding window rate limiting
- [x] Scheduled notifications (BullMQ native delay)
- [x] Prometheus + Grafana observability
- [x] Correlation ID request tracing
- [x] Docker Compose multi-worker topology
- [x] Live deployment on Render
- [ ] Unit + integration tests (Testcontainers)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] k6 load testing with documented results
- [ ] DLQ manual-retry admin endpoint
- [ ] Outbox pattern for delivery confirmation atomicity
- [ ] Provider fallback (secondary email provider)
- [ ] OpenAPI / Swagger documentation
- [ ] Per-tenant rate limit configuration
- [ ] Webhook signature verification

---

## 👨‍💻 Author

**Priyansh Soni**

Built Nexus from scratch — every architectural decision, every production bug, every line of the observability stack.

[![GitHub](https://img.shields.io/badge/GitHub-priyansh00soni-181717?style=flat-square&logo=github)](https://github.com/priyansh00soni)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-priyansh00soni-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/priyansh00soni/)

---

<div align="center">

*Nexus — because notification delivery is an infrastructure problem, not a feature.*

</div>
