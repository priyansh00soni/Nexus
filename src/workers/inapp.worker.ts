import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/PrismaClient.js';
import ApiError from '../utils/ApiError.js';
import { resolveNotificationMessage } from '../utils/resolveNotificationMessage.js';

const worker = new Worker('inapp-queue',async job => {

    const {subjectString, messageString, notification} =await resolveNotificationMessage(job.data.notification_id)

    //Inapp notification - The notification is already in the DB from when it was created. The worker just marks it as delivered. When the user opens the app, they call GET /notifications/inapp and your API returns all their notifications from DB.

    
    //DB updates
    
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
            attempts:{increment:1}
          }
      })
    ])
    
  },{ connection: bullmqConnection },
);

  worker.on('completed',async job => {
    logger.info(`${job.id} has completed!`);

  });

  worker.on('failed',async (job, err) => {
    logger.info(`${job?.id} has failed with ${err.message}`);
  });
