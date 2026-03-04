import { Queue } from 'bullmq';
import { getBullMQConnectionOptions } from '../../shared/redis/redis-client';

export interface ReportNotificationJobData {
  companyId: string;
  reportId: string;
}

let notificationQueue: Queue<ReportNotificationJobData> | null = null;

export function getNotificationQueue(): Queue<ReportNotificationJobData> {
  if (!notificationQueue) {
    notificationQueue = new Queue<ReportNotificationJobData>('notificationEvents', {
      connection: getBullMQConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return notificationQueue!;
}
