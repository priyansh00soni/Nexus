import { Router} from "express";
import { getDLQ, healthCheck, setMetrics } from "./monitoring.controller.js";


const router = Router()

router.route('/').get(healthCheck)

router.route('/metrics').get(setMetrics)

router.route('/dlq').get(getDLQ)



export default router