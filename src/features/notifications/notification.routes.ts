import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createNotificationController, getNotificationsController, getNotificationStatusController } from "./notification.controller.js";
import { createNotificationSchema, getNotificationsSchema, getNotificationStatusSchema } from "./notification.zodSchema.js";
import idempotencyMid from "../../middleware/idempotency.middleware.js";
import rateLimit from "../../middleware/rateLimit.middleware.js";

const router = Router()

/**
 * @openapi
 * /api/v1/notification:
 *   post:
 *     summary: Create or schedule a notification
 *     description: Send a notification using a template ID or a raw message layout.
 *     security:
 *       - ApiKeyAuth: []
 *     headers:
 *       Idempotency-Key:
 *         schema:
 *           type: string
 *         required: true
 *         description:  unique key to prevent duplicate processing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/RawNotificationPayload'
 *               - $ref: '#/components/schemas/TemplateNotificationPayload'
 *     responses:
 *       201:
 *         description: Notification processed or scheduled successfully.
 *       400:
 *         description: Validation error (e.g., providing both template_id and message).
 *       401:
 *         description: Invalid or missing API key.
 *       429:
 *         description: Rate limit exceeded.
 *
 *   get:
 *     summary: Retrieve filtered list of notifications
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, scheduledFor]
 *           default: created_at
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, FAILED, PROCESSING, SCHEDULED]
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [EMAIL, INAPP, WEBHOOK]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter records created after this timestamp.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter records created before this timestamp.
 *     responses:
 *       200:
 *         description: A paginated list of notifications.
 *       401:
 *         description: Invalid or missing API key.
 *
 * /api/v1/notification/{notification_id}:
 *   get:
 *     summary: Get tracking status of a notification
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique notification tracing identifier.
 *     responses:
 *       200:
 *         description: Tracking details retrieved successfully.
 *       401:
 *         description: Invalid or missing API key.
 *       404:
 *         description: Notification history item not found.
 *
 */




router.route('/').post(authMid,validate(createNotificationSchema),idempotencyMid,rateLimit,createNotificationController)
.get(authMid,validate(getNotificationsSchema),getNotificationsController)

router.route('/:notification_id').get(authMid,validate(getNotificationStatusSchema),getNotificationStatusController)



export default router