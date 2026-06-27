import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/PrismaClient.js';
import { templateRenderer } from '../utils/templateRenderer.js';
import ApiError from '../utils/ApiError.js';
import { Resend } from 'resend';

const worker = new Worker('email-queue',async job => {

    const notification = await prisma.notification.findUnique({
      where:{id:job.data.notification_id}
    })

    if(!notification) throw new ApiError(404, "Notification not found")

    let messageString 

    if(notification.template_id){
      const templateMessage = await prisma.template.findUnique({
        where:{id:notification.template_id},
        select:{
          message:true
        }
      })

      if(!templateMessage) throw new ApiError(404, "Template not found")


      messageString = templateRenderer(templateMessage.message,notification.variables as Record<string, unknown>)
    }

    if(!notification.message) throw new ApiError(404, "Message not found")

    else messageString = templateRenderer(notification.message,notification.variables as Record<string, unknown>)

    //Send Mail via Resend

    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from: 'onboarding@resend.dev',
      to: notification.recipient,
      subject: 'Hello World',
      html: messageString
  });

  },{ connection: bullmqConnection },
);

worker.on('completed', job => {
  logger.info(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  logger.info(`${job?.id} has failed with ${err.message}`);
});