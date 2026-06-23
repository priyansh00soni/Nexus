import { Router } from "express";
import createTenantController from "./tenant.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { createTenantSchema } from "./tenant.zodSchema.js";

const router = Router()

router.route('/').post(validate(createTenantSchema),createTenantController)

export default router