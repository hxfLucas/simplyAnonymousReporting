import { getAppDataSource } from '../../shared/database/data-source';
import { Report } from '../reports/reports.entity';
import { getNotificationQueue } from './notifications.queue';

export async function getNewReportCount(companyId: string): Promise<number> {
  return getAppDataSource().getRepository(Report).count({ where: { companyId, status: 'new' } });
}

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
