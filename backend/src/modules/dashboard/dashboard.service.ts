import { getAppDataSource } from '../../shared/database/data-source';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';
import { User } from '../users/users.entity';
import { Report } from '../reports/reports.entity';
import { MagicLink } from '../magiclinks/magiclinks.entity';
import type { DashboardStats } from './dashboard.dtos';

export type { DashboardStats };

export async function getDashboardStats(): Promise<DashboardStats> {
  const { companyId } = getAuthenticatedUserData();
  const ds = getAppDataSource();

  const [totalCountUsers, reportCounts, totalMagicLinksGenerated] = await Promise.all([
    // Query 1: total users in company
    ds.getRepository(User).count({ where: { companyId } }),

    // Query 2: report counts grouped by status
    ds
      .getRepository(Report)
      .createQueryBuilder('report')
      .select('report.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('report.companyId = :companyId', { companyId })
      .groupBy('report.status')
      .getRawMany<{ status: string; count: string }>(),

    // Query 3: total magic links for company
    ds.getRepository(MagicLink).count({ where: { companyId } }),
  ]);

  // Zero-fill all statuses
  const countsByStatus: Record<string, number> = {
    new: 0,
    in_review: 0,
    resolved: 0,
    rejected: 0,
  };
  for (const row of reportCounts) {
    countsByStatus[row.status] = Number(row.count);
  }

  return {
    totalCountUsers,
    totalCountReportsNew: countsByStatus['new'],
    totalCountReportsInReview: countsByStatus['in_review'],
    totalCountReportsResolved: countsByStatus['resolved'],
    totalCountReportsRejected: countsByStatus['rejected'],
    totalMagicLinksGenerated,
  };
}
