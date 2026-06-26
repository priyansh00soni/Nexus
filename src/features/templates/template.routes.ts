import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createTemplateController, deleteTemplateController, getTemplateController, updateTemplateController } from "./template.controller.js";
import { createTemplateSchema, updateTemplateSchema } from "./templates.zodSchema.js";

const router = Router()

router.route('/').post(authMid,validate(createTemplateSchema),createTemplateController)
router.route('/:template_id').get(authMid,getTemplateController)
.put(authMid,validate(updateTemplateSchema),updateTemplateController)
.delete(authMid,deleteTemplateController)

export default router