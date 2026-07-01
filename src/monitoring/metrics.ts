import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from "prom-client";

const register = new Registry

collectDefaultMetrics({register})

export const successfulRequestsCounter = new Counter({
    name: 'notifications_sent_total',
    help:'Total number of notifications sent Successfully.',
    labelNames:['channel','tenant_id'],
    registers:[register]
})

export const failedRequestsCounter = new Counter({
    name: 'notifications_failed_total',
    help:'Total number of notifications Failed.',
    labelNames:['channel','tenant_id'],
    registers:[register]
})

export const duration = new Histogram({
    name:'notification_delivery_duration_seconds',
    help:'Time taken by notifications to deliver',
    labelNames:['channel'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers:[register]
})

export const queueDepth = new Gauge({
    name:'queue_depth',
    help:'Current number of jobs in the queue',
    labelNames:['queue_name'],
    registers:[register]
})

export default register
