import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createNotificationController, getNotificationsController, getNotificationStatusController } from "./notification.controller.js";
import { createNotificationSchema, getNotificationsSchema, getNotificationStatusSchema } from "./notification.zodSchema.js";
import idempotencyMid from "../../middleware/idempotency.middleware.js";

const router = Router()
router.route('/').post(authMid,validate(createNotificationSchema),idempotencyMid,createNotificationController)
.get(authMid,validate(getNotificationsSchema),getNotificationsController)

router.route('/:notification_id').get(authMid,validate(getNotificationStatusSchema),getNotificationStatusController)



export default router