import { Router} from "express";
import { healthCheck, setMetrics } from "./monitoring.controller.js";


const router = Router()

router.route('/').get(healthCheck)

router.route('/metrics').get(setMetrics)





export default router