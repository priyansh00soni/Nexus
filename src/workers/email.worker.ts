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
    let subjectString

    if(notification.template_id){
      const template = await prisma.template.findUnique({
        where:{id:notification.template_id},
      })

      if(!template) throw new ApiError(404, "Template not found")

      messageString = templateRenderer(template.message,notification.variables as Record<string, unknown>)

      subjectString = template.subject
    }

    else{
      if(!notification.message) throw new ApiError(404, "Message not found")
      messageString = templateRenderer(notification.message,notification.variables as Record<string, unknown>)
      subjectString = notification.subject
    }

    if(!subjectString) throw new ApiError(400,"Subject not provided")
    if(!messageString) throw new ApiError(400, "Message could not be resolved")

    //Send Mail via Resend

    const tenant = await prisma.tenant.findFirst({
      where:{id:notification.tenant_id},
    })

    if(!tenant?.from_email) throw new ApiError(400,"Client email not provided.")
    

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: tenant.from_email,
      to: notification.recipient,
      subject: subjectString,
      html: messageString
    });

    //DB updates

    await prisma.deliveryAttempt.create({
      data:{
        notification_id:job?.data.notification_id,
        status:"COMPLETED",
      }
    })

    await prisma.notification.update({
      where:{id: job?.data.notification_id},
      data:{
        status:"COMPLETED",
        attempts:{increment:1}
      }
    })


  },{ connection: bullmqConnection },
);

  worker.on('completed',async job => {
    logger.info(`${job.id} has completed!`);

  });

  worker.on('failed',async (job, err) => {
    logger.info(`${job?.id} has failed with ${err.message}`);
  });
