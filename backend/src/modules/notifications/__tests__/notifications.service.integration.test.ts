/// <reference types="jest" />
import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { createTestDataSource } from '../../../shared/test-helpers/createTestDataSource';
import { Company } from '../../companies/companies.entity';
import { Report } from '../../reports/reports.entity';
import { getNewReportCount, enqueueReportNotification } from '../notifications.service';
import { getNotificationQueue } from '../notifications.queue';

// Mock BullMQ queue to prevent Redis connections.
// The factory must be self-contained (no external const refs) due to jest.mock hoisting.
jest.mock('../notifications.queue', () => ({
  getNotificationQueue: jest.fn().mockReturnValue({
    add: jest.fn().mockResolvedValue({}),
  }),
}));

// Capture the mock reference after the module is mocked.
const mockQueueAdd = (getNotificationQueue() as unknown as { add: jest.Mock }).add;

let ds: DataSource;
let companyAId: string;
let companyBId: string;

beforeAll(async () => {
  ds = await createTestDataSource();

  const companyRepo = ds.getRepository(Company);
  const reportRepo = ds.getRepository(Report);

  const companyA = await companyRepo.save(companyRepo.create({ name: 'Company A' }));
  const companyB = await companyRepo.save(companyRepo.create({ name: 'Company B' }));
  companyAId = companyA.id;
  companyBId = companyB.id;

  // Company A: 2 'new', 1 'in_review', 1 'resolved'
  await reportRepo.save([
    reportRepo.create({ companyId: companyAId, title: 'Report 1', description: 'desc', status: 'new' }),
    reportRepo.create({ companyId: companyAId, title: 'Report 2', description: 'desc', status: 'new' }),
    reportRepo.create({ companyId: companyAId, title: 'Report 3', description: 'desc', status: 'in_review' }),
    reportRepo.create({ companyId: companyAId, title: 'Report 4', description: 'desc', status: 'resolved' }),
  ]);

  // Company B: 1 'new' (isolation check)
  await reportRepo.save(
    reportRepo.create({ companyId: companyBId, title: 'Report B1', description: 'desc', status: 'new' }),
  );
});

afterAll(async () => {
  await ds?.destroy();
});

beforeEach(() => {
  mockQueueAdd.mockClear();
});

// ─── getNewReportCount ─────────────────────────────────────────────────────────

describe('getNewReportCount', () => {
  it('returns the count of reports with status "new" for the given company', async () => {
    const count = await getNewReportCount(companyAId);
    expect(count).toBe(2);
  });

  it('does not count "in_review" or "resolved" reports', async () => {
    const count = await getNewReportCount(companyAId);
    expect(count).not.toBe(4); // total reports for company A
  });

  it('is isolated — company B reports do not affect company A count', async () => {
    const countA = await getNewReportCount(companyAId);
    const countB = await getNewReportCount(companyBId);

    expect(countA).toBe(2);
    expect(countB).toBe(1);
  });

  it('returns 0 for a company with no new reports', async () => {
    // Use a random UUID that has no reports in the DB
    const count = await getNewReportCount('00000000-0000-0000-0000-000000000000');
    expect(count).toBe(0);
  });
});

// ─── enqueueReportNotification ────────────────────────────────────────────────

describe('enqueueReportNotification', () => {
  it('calls queue.add with job name "report-submitted"', async () => {
    const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    await enqueueReportNotification(companyAId, reportId);

    expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'report-submitted',
      { companyId: companyAId, reportId },
      { jobId: `report-${reportId}` },
    );
  });

  it('uses reportId as jobId to ensure idempotency', async () => {
    const reportId = 'ffffffff-0000-1111-2222-333333333333';
    await enqueueReportNotification(companyAId, reportId);

    const [, , options] = mockQueueAdd.mock.calls[0];
    expect(options).toEqual({ jobId: `report-${reportId}` });
  });

  it('resolves without throwing', async () => {
    await expect(
      enqueueReportNotification(companyBId, 'cccccccc-dddd-eeee-ffff-000000000000'),
    ).resolves.toBeUndefined();
  });
});
