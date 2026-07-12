import { Router } from "express";
import validate from "../../middleware/validate.middleware.js";
import authMid from "../../middleware/auth.middleware.js";
import { createTemplateController, deleteTemplateController, getTemplateController, updateTemplateController } from "./template.controller.js";
import { createTemplateSchema, updateTemplateSchema } from "./template.zodSchema.js";

const router = Router()

/**
 * @openapi
 * /api/v1/templates:
 *   post:
 *     summary: Create a new template
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 description: The main content of the template.
 *               subject:
 *                 type: string
 *                 description: Optional subject line.
 *     responses:
 *       201:
 *         description: Template created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Invalid or missing API key.
 *
 * /api/v1/templates/{template_id}:
 *   get:
 *     summary: Get a template by ID
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: template_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the template.
 *     responses:
 *       200:
 *         description: Template details retrieved successfully.
 *       401:
 *         description: Invalid or missing API key.
 *       404:
 *         description: Template not found.
 *
 *   patch:
 *     summary: Update an existing template
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: template_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the template.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 description: Updated template content.
 *               subject:
 *                 type: string
 *                 description: Updated subject line.
 *     responses:
 *       200:
 *         description: Template updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Invalid or missing API key.
 *       404:
 *         description: Template not found.
 *
 *   delete:
 *     summary: Delete a template
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: template_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the template.
 *     responses:
 *       200:
 *         description: Template deleted successfully.
 *       401:
 *         description: Invalid or missing API key.
 *       404:
 *         description: Template not found.
 */



router.route('/').post(authMid,validate(createTemplateSchema),createTemplateController)
router.route('/:template_id').get(authMid,getTemplateController)
.patch(authMid,validate(updateTemplateSchema),updateTemplateController)
.delete(authMid,deleteTemplateController)

export default router