import { Worker, Job } from 'bullmq';
import { getRedisClient, getBullMQConnectionOptions } from '../../shared/redis/redis-client';
import { getAppDataSource } from '../../shared/database/data-source';
import { User } from '../users/users.entity';
import { ReportNotificationJobData } from './notifications.queue';
import { sendEmail } from '../../shared/email/email';

const DEDUP_TTL_SECONDS = 5 * 60; // 5 minutes

function dedupKey(companyId: string): string {
  return `notification:dedup:${companyId}`;
}

async function notifyManagersByEmail(
  companyId: string,
  reportId: string
): Promise<void> {
  const redis = getRedisClient();

  // Anti-spam: skip if a notification was already sent for this company in the last 5 minutes
  const alreadySent = await redis.get(dedupKey(companyId));
  if (alreadySent) {
    console.log(
      `[notifications] Dedup: skipping email for company ${companyId} (report ${reportId})`
    );
    return;
  }

  // Fetch all manager-role users for the company
  // Uses TypeScript property names: `companyId` (mapped to company_id column) and `role`
  const userRepo = getAppDataSource().getRepository(User);
  const managers = await userRepo.find({
    where: { companyId, role: 'manager' },
    select: ['id', 'email'],
  });

  if (managers.length === 0) {
    console.log(
      `[notifications] No managers found for company ${companyId}; skipping email.`
    );
  } else {
    const bccAddresses = managers.map((u) => u.email);
    await sendEmail({
      to: process.env.SMTP_FROM ?? 'noreply@yourapp.com',
      bcc: bccAddresses,
      subject: 'New report submitted',
      text: 'A new report has been submitted. Please log in to review it.',
    });
    console.log(
      `[notifications] Email sent (BCC) for company ${companyId} ` +
        `to ${bccAddresses.length} manager(s).`
    );
  }

  // Set dedup TTL regardless — even if there are no managers, block repeated attempts
  await redis.set(dedupKey(companyId), '1', 'EX', DEDUP_TTL_SECONDS);
}

export function createNotificationWorker(): Worker<ReportNotificationJobData> {
  const worker = new Worker<ReportNotificationJobData>(
    'notificationEvents',
    async (job: Job<ReportNotificationJobData>) => {
      const { companyId, reportId } = job.data;
      await notifyManagersByEmail(companyId, reportId);
    },
    {
      connection: getBullMQConnectionOptions(),
      concurrency: 2,
    }
  );

  worker.on('completed', (job) =>
    console.log(`[notifications] Job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    console.error(`[notifications] Job ${job?.id} failed:`, err.message)
  );

  return worker;
}
