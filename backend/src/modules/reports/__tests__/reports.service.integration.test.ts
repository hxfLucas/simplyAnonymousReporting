import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createTestDataSource } from '../../../shared/test-helpers/createTestDataSource';
import { runWithTestAuth } from '../../../shared/test-helpers/runWithTestAuth';
import { seedCompany, seedUser, seedMagicLink } from '../../../shared/test-helpers/seeders';
import { makeAdminAuth } from '../../../shared/test-helpers/authFactories';
import { Report } from '../reports.entity';
import { ReportStatusHistory } from '../report-status-history.entity';
import {
  validateReportToken,
  submitReport,
  listReports,
  deleteReport,
  updateReportStatus,
} from '../reports.service';

jest.mock('../../notifications/notifications.service', () => ({
  enqueueReportNotification: jest.fn().mockResolvedValue(undefined),
  getNewReportCount: jest.fn().mockResolvedValue(0),
}));

// ── seed data ────────────────────────────────────────────────────────────────
let ds: DataSource;

// well-known IDs
let companyId: string;
let userId: string;
const REPORTING_TOKEN = 'test-reporting-token-abc123';

beforeAll(async () => {
  ds = await createTestDataSource();

  const company = await seedCompany(ds, { name: 'Acme Corp' });
  companyId = company.id;

  const user = await seedUser(ds, { companyId, email: 'admin@acme.com' });
  userId = user.id;

  await seedMagicLink(ds, { companyId, createdById: userId, reportingToken: REPORTING_TOKEN });
});

afterAll(async () => {
  await ds.destroy();
});

// ─────────────────────────────────────────────────────────────────────────────
// validateReportToken
// ─────────────────────────────────────────────────────────────────────────────
describe('validateReportToken', () => {
  it('returns companyId and companyName for a valid token', async () => {
    const result = await validateReportToken(REPORTING_TOKEN);
    expect(result.companyId).toBe(companyId);
    expect(result.companyName).toBe('Acme Corp');
  });

  it('throws NOT_FOUND (404) for an unknown token', async () => {
    await expect(validateReportToken('no-such-token')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// submitReport
// ─────────────────────────────────────────────────────────────────────────────
describe('submitReport', () => {
  it('saves a report with status "new" and trimmed fields', async () => {
    const saved = await submitReport({
      token: REPORTING_TOKEN,
      title: '  Some title  ',
      description: '  Some description  ',
    });

    expect(saved.id).toBeDefined();
    expect(saved.companyId).toBe(companyId);
    expect(saved.title).toBe('Some title');
    expect(saved.description).toBe('Some description');
    expect(saved.status).toBe('new');

    // verify it's actually in the DB
    const inDb = await ds.getRepository(Report).findOneBy({ id: saved.id });
    expect(inDb).not.toBeNull();
  });

  it('throws VALIDATION_ERROR (400) when title is empty', async () => {
    await expect(
      submitReport({ token: REPORTING_TOKEN, title: '', description: 'desc' })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  it('throws VALIDATION_ERROR (400) when title is whitespace-only', async () => {
    await expect(
      submitReport({ token: REPORTING_TOKEN, title: '   ', description: 'desc' })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  it('throws VALIDATION_ERROR (400) when description is empty', async () => {
    await expect(
      submitReport({ token: REPORTING_TOKEN, title: 'Title', description: '' })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  it('throws VALIDATION_ERROR (400) when description is whitespace-only', async () => {
    await expect(
      submitReport({ token: REPORTING_TOKEN, title: 'Title', description: '   ' })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  it('throws NOT_FOUND (404) when token is invalid', async () => {
    await expect(
      submitReport({ token: 'invalid-token', title: 'Title', description: 'desc' })
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// listReports
// ─────────────────────────────────────────────────────────────────────────────
describe('listReports', () => {
  beforeAll(async () => {
    // Ensure at least 3 reports exist for the pagination tests
    const reportRepo = ds.getRepository(Report);
    const promises = Array.from({ length: 3 }, (_, i) =>
      reportRepo.save(
        reportRepo.create({
          companyId,
          title: `List test report ${i + 1}`,
          description: `Description ${i + 1}`,
          status: 'new',
        })
      )
    );
    await Promise.all(promises);
  });

  it('returns paginated results scoped to the auth companyId', async () => {
    const result = await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () => listReports(0, 25));
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    result.data.forEach((r) => expect(r.companyId).toBe(companyId));
  });

  it('returns hasMore=true when there are more results beyond the page', async () => {
    // seed enough reports to exceed limit of 1
    const total = await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () =>
      listReports(0, 25).then((r) => r.total)
    );

    if (total >= 2) {
      const result = await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () => listReports(0, 1));
      expect(result.hasMore).toBe(true);
    } else {
      // not enough data to test — skip gracefully
      expect(true).toBe(true);
    }
  });

  it('returns hasMore=false on the last page', async () => {
    const result = await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () => listReports(0, 10000));
    expect(result.hasMore).toBe(false);
  });

  it('throws when called without an auth context', async () => {
    await expect(listReports(0, 25)).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteReport
// ─────────────────────────────────────────────────────────────────────────────
describe('deleteReport', () => {
  it('removes an existing report from the DB', async () => {
    const reportRepo = ds.getRepository(Report);
    const report = await reportRepo.save(
      reportRepo.create({
        companyId,
        title: 'To be deleted',
        description: 'Goodbye',
        status: 'new',
      })
    );

    await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () => deleteReport(report.id));

    const inDb = await ds.getRepository(Report).findOneBy({ id: report.id });
    expect(inDb).toBeNull();
  });

  it('throws NOT_FOUND (404) for a non-existent report id', async () => {
    await expect(
      runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () =>
        deleteReport('00000000-0000-0000-0000-000000000000')
      )
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('throws NOT_FOUND (404) when report belongs to a different company', async () => {
    const reportRepo = ds.getRepository(Report);
    const report = await reportRepo.save(
      reportRepo.create({
        companyId,
        title: 'Cross-company',
        description: 'Should not be deletable by another company',
        status: 'new',
      })
    );

    // Create a second company and act as that company's admin
    const otherCompany = await seedCompany(ds, { name: 'Other Corp' });
    const otherUser = await seedUser(ds, { companyId: otherCompany.id, email: 'admin@other.com' });

    await expect(
      runWithTestAuth(
        makeAdminAuth({ id: otherUser.id, companyId: otherCompany.id }),
        () => deleteReport(report.id)
      )
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateReportStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('updateReportStatus', () => {
  let reportId: string;

  beforeAll(async () => {
    const reportRepo = ds.getRepository(Report);
    const r = await reportRepo.save(
      reportRepo.create({
        companyId,
        title: 'Status update test',
        description: 'Will have its status changed',
        status: 'new',
      })
    );
    reportId = r.id;
  });

  it('updates the status and creates a ReportStatusHistory row', async () => {
    const updated = await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () =>
      updateReportStatus({ id: reportId, status: 'in_review' })
    );

    expect(updated.status).toBe('in_review');

    const historyRows = await ds
      .getRepository(ReportStatusHistory)
      .findBy({ reportId });

    expect(historyRows.length).toBe(1);
    expect(historyRows[0].oldStatus).toBe('new');
    expect(historyRows[0].newStatus).toBe('in_review');
    expect(historyRows[0].changedBy).toBe(userId);
  });

  it('returns the report unchanged when setting the same status (no history entry added)', async () => {
    const historyBefore = await ds
      .getRepository(ReportStatusHistory)
      .findBy({ reportId });

    const result = await runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () =>
      updateReportStatus({ id: reportId, status: 'in_review' })
    );

    const historyAfter = await ds
      .getRepository(ReportStatusHistory)
      .findBy({ reportId });

    expect(result.status).toBe('in_review');
    expect(historyAfter.length).toBe(historyBefore.length);
  });

  it('throws NOT_FOUND (404) for a non-existent report id', async () => {
    await expect(
      runWithTestAuth(makeAdminAuth({ id: userId, companyId }), () =>
        updateReportStatus({ id: '00000000-0000-0000-0000-000000000000', status: 'resolved' })
      )
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('throws NOT_FOUND (404) when report belongs to a different company', async () => {
    const otherCompany = await seedCompany(ds, { name: 'Other Corp 2' });
    const otherUser = await seedUser(ds, { companyId: otherCompany.id, email: 'admin@other2.com' });

    await expect(
      runWithTestAuth(
        makeAdminAuth({ id: otherUser.id, companyId: otherCompany.id }),
        () => updateReportStatus({ id: reportId, status: 'resolved' })
      )
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});
