import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/PrismaClient.js';
import ApiError from '../utils/ApiError.js';
import { Resend } from 'resend';
import { resolveNotificationMessage } from '../utils/resolveNotificationMessage.js';

const worker = new Worker('email-queue',async job => {

    const {subjectString, messageString, notification} =await resolveNotificationMessage(job.data.notification_id)

    if(!subjectString) throw new ApiError(400,"Subject not provided")

    //Send Mail via Resend

    const tenant = await prisma.tenant.findFirst({
      where:{id:notification.tenant_id},
    })

    if(!tenant?.from_email) throw new ApiError(400,"Client email not provided.")
    

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: notification.recipient,
      subject: subjectString,
      html: messageString
    });

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
