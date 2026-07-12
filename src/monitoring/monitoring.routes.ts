import { Router} from "express";
import { getDLQ, healthCheck, setMetrics } from "./monitoring.controller.js";


const router = Router()


/** 
 * @openapi
 * /api/v1/monitoring:
 *   get:
 *     description: Returns health of the Api by testing redis and postgres!
 *     responses:
 *       200:
 *         description: Returns OK status if DB, Redis and queues are healthy
 */

/**
 * @openapi
 * /api/v1/monitoring/metrics:
 *   get:
 *     description: Returns Prometheus metrics including queue depths, counters and histograms for monitoring.
 *     responses:
 *       200:
 *         description: Prometheus formatted metrics data for all queues and system counters.
 */

/**
 * @openapi
 * /api/v1/monitoring/dlq:
 *   get:
 *     description: Returns jbs in DLQ.
 *     responses:
 *       200:
 *         description: formatted jobs sitting in DLQ.
 */

router.route('/').get(healthCheck)

router.route('/metrics').get(setMetrics)

router.route('/dlq').get(getDLQ)



export default router