import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/PrismaClient.js';
import ApiError from '../utils/ApiError.js';
import { Resend } from 'resend';
import { resolveNotificationMessage } from '../utils/resolveNotificationMessage.js';
import { successfulRequestsCounter } from '../monitoring/metrics.js';

const worker = new Worker('email-queue',async job => {

    
      const {subjectString, messageString, notification} =await resolveNotificationMessage(job.data.notification_id)
      if(!subjectString) throw new ApiError(400,"Subject not provided")
      
      try{
        //Send Mail via Resend
        const tenant = await prisma.tenant.findFirst({
          where:{id:notification.tenant_id},
        })
    
        if(!tenant?.from_email) throw new Error("Client email not provided.")
    
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: notification.recipient,
          subject: subjectString,
          html: messageString
        });

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
              logger.error("DB update Failed in email job.",{
                  error: error instanceof Error ? error.message : String(error)
              })
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
        logger.error("DB update Failed in email job.",{
            error: error instanceof Error ? error.message : String(error)
        })
    }
    
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
      successfulRequestsCounter.inc({channel:"EMAIL",tenant_id:job.data.tenant_id})
      await prisma.notification.update({
        where:{id: job?.data.notification_id},
          data:{
            status:"COMPLETED"
          }
      })
      logger.info(`${job.id} for email has completed!`);
    } catch (error) {
        logger.error("DB update Failed in email job.",{
            error: error instanceof Error ? error.message : String(error)
        })
    }

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
        logger.error("DB update Failed in email job.",{
            error: error instanceof Error ? error.message : String(error)
        })
    }
  });
