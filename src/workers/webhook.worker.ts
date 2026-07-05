import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/prismaClient.js';
import { resolveNotificationMessage } from '../utils/resolveNotificationMessage.js';
import { duration, failedRequestsCounter, successfulRequestsCounter } from '../monitoring/metrics.js';

const worker = new Worker('webhook-queue',async job => {

    const end = duration.startTimer({channel:'WEBHOOK'})

    const { messageString, notification} =await resolveNotificationMessage(job.data.notification_id)

    //webhook notification

   try {
     const tenant= await prisma.tenant.findFirst({
         where:{id:notification.tenant_id}
     })
 
     if(!tenant) throw new Error("DB failure while accessing tenant.")
 
     const payload = {
         message:messageString,
         timestamp: new Date().toISOString(),
         notification_id:notification.id,
         tenant_id:tenant.id
     }
 
     const response = await fetch(notification.recipient,{
         method:'POST',
         headers:{'Content-Type': 'application/json'},
         body: JSON.stringify(payload)
     })
 
     if(!response.ok)  throw new Error("Webhook delivery failed")
   } catch (error) {
      try {
            await prisma.$transaction([
                prisma.deliveryAttempt.create({
                    data:{
                      notification_id:job?.data.notification_id,
                      status:"FAILED",
                    }
                }),
        
              prisma.notification.update({
                  where:{id: job?.data.notification_id},
                  data:{
                    attempts:{increment:1}
                  }
              })
            ])
          } catch (error) {
              logger.error("DB update Failed in webhook job.", {
                error: error instanceof Error ? error.message : String(error),
                correlationId: job.data.correlationId,
              });
          }
          
          throw error
   }

    //DB updates
    
    try {
        await prisma.deliveryAttempt.create({
            data:{
              notification_id:job?.data.notification_id,
              status:"COMPLETED",
            }
        })
    } catch (error) {
        logger.error("DB update Failed in WEBHOOK job.", {
          error: error instanceof Error ? error.message : String(error),
          correlationId: job.data.correlationId,
        });
    }

    end()
    
    //backoff settings

  },{ connection: bullmqConnection,
      settings: {
            backoffStrategy: (attemptsMade) => {
                return Math.min(1000 * 2 ** attemptsMade, 30000)
        }
      } 
    }
);

worker.on('completed',async job => { //fires after the processor function finishes without throwing.
    try {
      successfulRequestsCounter.inc({channel:"WEBHOOK",tenant_id:job.data.tenant_id})
      await prisma.notification.update({
        where:{id: job?.data.notification_id},
          data:{
            status:"COMPLETED"
          }
      })
      logger.info(`${job.id} for webhook has completed!`, {
        correlationId: job.data.correlationId,
      });
    } catch (error) {
        logger.error("DB update Failed in WEBHOOK job.", {
          error: error instanceof Error ? error.message : String(error),
          correlationId: job.data.correlationId,
        });
    }

  });

  worker.on('failed',async (job, error) => { //fires after a job fails AND has exhausted all retries.
    try {
      failedRequestsCounter.inc({channel:"WEBHOOK",tenant_id:job?.data.tenant_id})
      await prisma.notification.update({
        where:{id: job?.data.notification_id},
          data:{
            status:"FAILED",
            error_message: error instanceof Error ? error.message : String(error)
          }
      })
      logger.info(`${job?.id} has failed with ${error.message}`, {
        correlationId: job?.data.correlationId,
      });
    } catch (error) {
        logger.error("DB update Failed in webhook job.", {
          error: error instanceof Error ? error.message : String(error),
          correlationId: job?.data.correlationId,
        });
    }
  });

