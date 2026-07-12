import { Router } from "express";
import {createTenantController} from "./tenant.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { createTenantSchema } from "./tenant.zodSchema.js";

const router = Router()


/**
 * @openapi
 * /api/v1/tenant:
 *   post:
 *     description: Creates new Tenant.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               from_email:
 *                  type: string
 *     responses:
 *       201:
 *         description: Returns Tenant's details.
 */


router.route('/').post(validate(createTenantSchema),createTenantController)

export default router