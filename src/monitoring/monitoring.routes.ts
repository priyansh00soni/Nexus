import { Router } from "express";
import { healthCheck } from "./monitoring.controller.js";

const router = Router()

router.route('/').get(healthCheck)

export default router