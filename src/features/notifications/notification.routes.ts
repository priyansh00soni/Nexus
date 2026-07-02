import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createNotificationController, getNotificationStatusController } from "./notification.controller.js";
import { createNotificationSchema, getNotificationStatusSchema } from "./notification.zodSchema.js";
import idempotencyMid from "../../middleware/idempotency.middleware.js";

const router = Router()
router.route('/').post(authMid,validate(createNotificationSchema),idempotencyMid,createNotificationController)

router.route('/:notification_id').get(authMid,validate(getNotificationStatusSchema),getNotificationStatusController)


export default router