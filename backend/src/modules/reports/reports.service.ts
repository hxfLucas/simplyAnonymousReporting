import { randomUUID } from 'node:crypto';
import { getAppDataSource } from '../../shared/database/data-source';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';
import { MagicLink } from '../magiclinks/magiclinks.entity';
import { enqueueReportNotification } from '../notifications/notifications.service';
import { Report, ReportStatus } from './reports.entity';
import { ReportStatusHistory } from './report-status-history.entity';
import type { ListReportsResponseDto, ValidateReportResponseDto } from './reports.dtos';

export async function validateReportToken(
  token: string
): Promise<ValidateReportResponseDto> {
  const repo = getAppDataSource().getRepository(MagicLink);
  const link = await repo.findOne({
    where: { reportingToken: token },
    relations: ['company'],
  });

  if (!link) {
    const err: any = new Error('Invalid or expired reporting token');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { companyId: link.company.id, companyName: link.company.name };
}

export async function submitReport(payload: {
  token: string;
  title: string;
  description: string;
}): Promise<Report> {
  const { companyId } = await validateReportToken(payload.token);

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim() === '') {
    const err: any = new Error('Title is required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (
    !payload.description ||
    typeof payload.description !== 'string' ||
    payload.description.trim() === ''
  ) {
    const err: any = new Error('Description is required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const repo = getAppDataSource().getRepository(Report);
  const report = repo.create({
    companyId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    status: 'new',
  });

  const saved = await repo.save(report);
  enqueueReportNotification(companyId, saved.id).catch((err) =>
    console.error('[notifications] Failed to enqueue report notification:', err)
  );
  return saved;
}

export async function listReports(offset: number = 0, limit: number = 25): Promise<ListReportsResponseDto> {
  const authData = getAuthenticatedUserData();

  if (!authData.companyId) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const repo = getAppDataSource().getRepository(Report);
  const [items, total] = await repo.findAndCount({
    where: { companyId: authData.companyId },
    order: { createdAt: 'DESC' },
    skip: offset,
    take: limit,
  });

  return { data: items, total, hasMore: offset + items.length < total };
}

export async function deleteReport(id: string): Promise<void> {
  const authData = getAuthenticatedUserData();
  const repo = getAppDataSource().getRepository(Report);

  const report = await repo.findOneBy({ id, companyId: authData.companyId });
  if (!report) {
    const err: any = new Error('Report not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  await repo.remove(report);
}

export async function updateReportStatus(payload: {
  id: string;
  status: ReportStatus;
}): Promise<Report> {
  const authData = getAuthenticatedUserData();
  const reportRepo = getAppDataSource().getRepository(Report);

  const report = await reportRepo.findOneBy({ id: payload.id, companyId: authData.companyId });
  if (!report) {
    const err: any = new Error('Report not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (payload.status === report.status) {
    return report;
  }

  const historyRepo = getAppDataSource().getRepository(ReportStatusHistory);
  const historyEntry = historyRepo.create({
    reportId: report.id,
    oldStatus: report.status,
    newStatus: payload.status,
    changedBy: authData.id,
  });
  await historyRepo.save(historyEntry);

  report.status = payload.status;
  return reportRepo.save(report);
}
