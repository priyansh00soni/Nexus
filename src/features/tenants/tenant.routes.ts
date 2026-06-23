import { Router } from "express";
import createTenantController from "./tenant.controller.js";

const router = Router()

router.route('/').post(createTenantController)

export default router