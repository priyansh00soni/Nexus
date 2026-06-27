import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createNotificationController } from "./notification.controller.js";

const router = Router()
router.route('/').post(validate,authMid,createNotificationController)

export default router