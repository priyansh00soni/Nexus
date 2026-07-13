import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";
import ApiError from "./utils/ApiError.js";
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'


const app:Express = express()

app.use(correlationID)

app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        credentials:true
    })
)

app.use(express.json({limit: '5mb'}))

app.use(express.urlencoded({ extended:true, limit:'5mb'}))

app.use(express.static('public'))

app.use(cookieParser())

//Swagger


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexus',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      },
      schemas: {
        RawNotificationPayload: {
          type: 'object',
          required: ['message', 'channel', 'recipient'],
          properties: {
            message: { type: 'string' },
            channel: { 
              type: 'string', 
              enum: ['EMAIL', 'INAPP', 'WEBHOOK'] 
            },
            recipient: { type: 'string' },
            variables: {
              type: 'object',
              additionalProperties: true
            },
            subject: { type: 'string' },
            scheduledFor: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TemplateNotificationPayload: {
          type: 'object',
          required: ['template_id', 'channel', 'recipient'],
          properties: {
            template_id: { type: 'string' },
            channel: { 
              type: 'string', 
              enum: ['EMAIL', 'INAPP', 'WEBHOOK'] 
            },
            recipient: { type: 'string' },
            variables: {
              type: 'object',
              additionalProperties: true
            },
            subject: { type: 'string' },
            scheduledFor: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: [
    'src/features/notifications/notification.routes.ts',
    'src/features/templates/template.routes.ts',
    'src/features/tenants/tenant.routes.ts',
    'src/monitoring/monitoring.routes.ts'
  ],
};


const swaggerSpecification = swaggerJsdoc(options);

app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecification));




//Routes

import MonitoringRouter from './monitoring/monitoring.routes.js'
import TenantRouter from './features/tenants/tenant.routes.js'
import TemplateRouter from './features/templates/template.routes.js'
import NotificationRouter from './features/notifications/notification.routes.js'


app.use('/api/v1/monitoring',MonitoringRouter)
app.use('/api/v1/tenant',TenantRouter)
app.use('/api/v1/template',TemplateRouter)
app.use('/api/v1/notification',NotificationRouter)


import { Prisma } from "./generated/prisma/client.js";
import { correlationID } from "./middleware/correlationID.middleware.js";

app.use((err:ApiError | Error,req:Request,res:Response,next:NextFunction)=>{

    if(err instanceof Prisma.PrismaClientKnownRequestError){
        if(err.code === 'P2002') return res.status(409).json({ success: false, message: "Resource already exists." })
        if(err.code === 'P2025') return res.status(404).json({ success: false, message: "Resource Not Found." })
    }

    const statusCode = err instanceof ApiError ? err.statusCode : 500
    return res.status(statusCode).json({ success: false, message: err.message || "Something went wrong" })
})

export default app
