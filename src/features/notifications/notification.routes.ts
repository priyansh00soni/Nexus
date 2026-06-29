import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createNotificationController } from "./notification.controller.js";
import { createNotificationSchema } from "./notification.zodSchema.js";
import idempotencyMid from "../../middleware/idempotency.middleware.js";

const router = Router()
router.route('/').post(authMid,validate(createNotificationSchema),idempotencyMid,createNotificationController)

export default router