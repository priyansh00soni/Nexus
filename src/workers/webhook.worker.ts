import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/PrismaClient.js';
import { resolveNotificationMessage } from '../utils/resolveNotificationMessage.js';
import ApiError from '../utils/ApiError.js';

const worker = new Worker('webhook-queue',async job => {

    const { messageString, notification} =await resolveNotificationMessage(job.data.notification_id)

    //webhook notification

    const tenant= await prisma.tenant.findFirst({
        where:{id:notification.tenant_id}
    })

    if(!tenant) throw new ApiError(404,"Client Not Found!")

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

    if(!response.ok)  throw new ApiError(500,"Webhook delivery failed")

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
