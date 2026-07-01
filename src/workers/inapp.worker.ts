import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/PrismaClient.js';
import { resolveNotificationMessage } from '../utils/resolveNotificationMessage.js';
import { duration, successfulRequestsCounter } from '../monitoring/metrics.js';

const worker = new Worker('inapp-queue',async job => {

    const end = duration.startTimer({channel:'EMAIL'})

    const {subjectString, messageString, notification}=await resolveNotificationMessage(job.data.notification_id)

    //Inapp notification - The notification is already in the DB from when it was created. The worker just marks it as delivered. When the user opens the app, they call GET /notifications/inapp and your API returns all their notifications from DB.

    
    //DB updates
    
    try {
      await prisma.$transaction([
          prisma.deliveryAttempt.create({
              data:{
                notification_id:job?.data.notification_id,
                status:"COMPLETED",
              }
          }),
        prisma.notification.update({
            where:{id: job?.data.notification_id},
            data:{
              status:"COMPLETED",
              attempts:{increment:1},
              message:messageString,
              subject:subjectString
            }
        })
      ])
    } catch (error) {
      logger.error("DB update Failed in email job.",{
            error: error instanceof Error ? error.message : String(error)
        })
    }

    end()
    
  },{ connection: bullmqConnection,
      settings: {
            backoffStrategy: (attemptsMade) => {
                return Math.min(1000 * 2 ** attemptsMade, 30000)
        }
      } 
    }
);

  worker.on('completed',async job => { //fires after the processor function finishes without throwing.
    successfulRequestsCounter.inc({channel:"EMAIL",tenant_id:job.data.tenant_id})
    logger.info(`${job.id} for inapp has completed!`);
  });

  worker.on('failed',async (job, error) => { //fires after a job fails AND has exhausted all retries.
    try {
      await prisma.notification.update({
        where:{id: job?.data.notification_id},
          data:{
            status:"FAILED",
            error_message: error instanceof Error ? error.message : String(error)
          }
      })
      logger.info(`${job?.id} has failed with ${error.message}`);
    } catch (error) {
        logger.error("DB update Failed in inApp job.",{
            error: error instanceof Error ? error.message : String(error)
        })
    }
  });
