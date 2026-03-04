import { getNotificationQueue } from './notifications.queue';

export async function enqueueReportNotification(
  companyId: string,
  reportId: string
): Promise<void> {
  const queue = getNotificationQueue();
  await queue.add(
    'report-submitted',
    { companyId, reportId },
    { jobId: `report-${reportId}` } // idempotency: same reportId won't be queued twice
  );
}
