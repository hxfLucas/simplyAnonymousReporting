import 'reflect-metadata';
import crypto from 'crypto';
import { DataSource } from 'typeorm';
import { createTestDataSource } from '../../../shared/test-helpers/createTestDataSource';
import { runWithTestAuth } from '../../../shared/test-helpers/runWithTestAuth';
import { seedCompany, seedUser } from '../../../shared/test-helpers/seeders';
import { makeAdminAuth, makeManagerAuth } from '../../../shared/test-helpers/authFactories';
import { User } from '../users.entity';
import {
  createUserForCompany,
  deleteUserFromCompany,
  updateUserPassword,
  listUsers,
} from '../users.service';

// ─── Shared state ────────────────────────────────────────────────────────────

let ds: DataSource;
let companyId: string;
let adminUserId: string;
let managerUserId: string;

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  ds = await createTestDataSource();

  const company = await seedCompany(ds, { name: 'Test Corp' });
  companyId = company.id;

  const admin = await seedUser(ds, { companyId, email: 'admin@test.com' });
  adminUserId = admin.id;

  const manager = await seedUser(ds, { companyId, email: 'manager@test.com', role: 'manager' });
  managerUserId = manager.id;
});

afterAll(async () => {
  await ds.destroy();
});

// ─── createUserForCompany ────────────────────────────────────────────────────

describe('createUserForCompany', () => {
  it('admin role → creates user; passwordHash is in salt:hex format and role is manager', async () => {
    const created = await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      createUserForCompany({ email: 'new-user@test.com', password: 'Secret123!' }),
    );

    expect(created.id).toBeDefined();
    expect(created.email).toBe('new-user@test.com');
    expect(created.role).toBe('manager');
    expect(created.passwordHash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);

    // Verify row is actually persisted
    const row = await ds.getRepository(User).findOneBy({ id: created.id });
    expect(row).not.toBeNull();
  });

  it('manager role → throws FORBIDDEN (403)', async () => {
    const err: any = await runWithTestAuth(makeManagerAuth({ id: managerUserId, companyId }), () =>
      createUserForCompany({ email: 'should-not-exist@test.com', password: 'pw' }),
    ).catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('duplicate email within same company → throws DUPLICATE_EMAIL (409)', async () => {
    // Seed the existing user directly so the service only calls createUserForCompany once
    const userRepo = ds.getRepository(User);
    await userRepo.save(
      userRepo.create({
        id: crypto.randomUUID(),
        companyId,
        email: 'duplicate@test.com',
        passwordHash: 'salthex:keyhex',
        role: 'manager',
      } as Partial<User>),
    );

    const err: any = await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      createUserForCompany({ email: 'duplicate@test.com', password: 'pw2' }),
    ).catch((e) => e);

    expect(err.status).toBe(409);
    expect(err.code).toBe('DUPLICATE_EMAIL');
  });
});

// ─── deleteUserFromCompany ───────────────────────────────────────────────────

describe('deleteUserFromCompany', () => {
  let targetManagerId: string;

  beforeEach(async () => {
    // Seed a fresh manager to delete in each test that needs one
    const userRepo = ds.getRepository(User);
    const freshId = crypto.randomUUID();
    await userRepo.save(
      userRepo.create({
        id: freshId,
        companyId,
        email: `to-delete-${Date.now()}@test.com`,
        passwordHash: 'salthex:keyhex',
        role: 'manager',
      } as Partial<User>),
    );
    targetManagerId = freshId;
  });

  it('admin deletes manager → user is removed from DB', async () => {
    await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      deleteUserFromCompany(targetManagerId, companyId),
    );

    const row = await ds.getRepository(User).findOneBy({ id: targetManagerId });
    expect(row).toBeNull();
  });

  it('manager role → throws FORBIDDEN (403)', async () => {
    const err: any = await runWithTestAuth(makeManagerAuth({ id: managerUserId, companyId }), () =>
      deleteUserFromCompany(targetManagerId, companyId),
    ).catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('unknown user id → throws NOT_FOUND (404)', async () => {
    const err: any = await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      deleteUserFromCompany('00000000-0000-0000-0000-000000000000', companyId),
    ).catch((e) => e);

    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('target user is admin → throws CANNOT_DELETE_ADMIN (403)', async () => {
    const err: any = await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      deleteUserFromCompany(adminUserId, companyId),
    ).catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.code).toBe('CANNOT_DELETE_ADMIN');
  });
});

// ─── updateUserPassword ──────────────────────────────────────────────────────

describe('updateUserPassword', () => {
  let targetUserId: string;

  beforeEach(async () => {
    const userRepo = ds.getRepository(User);
    const freshId = crypto.randomUUID();
    await userRepo.save(
      userRepo.create({
        id: freshId,
        companyId,
        email: `pw-target-${Date.now()}@test.com`,
        passwordHash: 'oldsalt:oldhex',
        role: 'manager',
      } as Partial<User>),
    );
    targetUserId = freshId;
  });

  it('admin updates password → new passwordHash is saved in salt:hex format', async () => {
    await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      updateUserPassword({ id: targetUserId, password: 'NewPass456!' }),
    );

    const row = await ds.getRepository(User).findOneBy({ id: targetUserId });
    expect(row).not.toBeNull();
    expect(row!.passwordHash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    expect(row!.passwordHash).not.toBe('oldsalt:oldhex');
  });

  it('non-admin role → throws FORBIDDEN (403)', async () => {
    const err: any = await runWithTestAuth(makeManagerAuth({ id: managerUserId, companyId }), () =>
      updateUserPassword({ id: targetUserId, password: 'irrelevant' }),
    ).catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('unknown user id → throws NOT_FOUND (404)', async () => {
    const err: any = await runWithTestAuth(makeAdminAuth({ id: adminUserId, companyId }), () =>
      updateUserPassword({ id: '00000000-0000-0000-0000-000000000000', password: 'pw' }),
    ).catch((e) => e);

    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});

// ─── listUsers ───────────────────────────────────────────────────────────────

describe('listUsers', () => {
  let listCompanyId: string;

  beforeAll(async () => {
    // Use a dedicated company so row counts are predictable
    const listCompany = await seedCompany(ds, { name: 'List Corp' });
    listCompanyId = listCompany.id;

    // Seed 3 users
    for (let i = 1; i <= 3; i++) {
      await seedUser(ds, {
        companyId: listCompanyId,
        email: `list-user-${i}@test.com`,
        role: 'manager',
      });
    }
  });

  it('returns correct { data, total, hasMore: false } when all results fit', async () => {
    const result = await listUsers({ companyId: listCompanyId, offset: 0, limit: 10 });

    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.data[0]).toMatchObject({
      email: expect.any(String),
      role: expect.any(String),
      companyId: listCompanyId,
      id: expect.any(String),
      createdAt: expect.any(Date),
    });
  });

  it('hasMore: true when there are more results than the limit', async () => {
    const result = await listUsers({ companyId: listCompanyId, offset: 0, limit: 2 });

    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });

  it('returns empty data for a company with no users', async () => {
    const emptyCompany = await seedCompany(ds, { name: 'Empty Corp' });

    const result = await listUsers({ companyId: emptyCompany.id, offset: 0, limit: 10 });

    expect(result.total).toBe(0);
    expect(result.data).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it('offset pagination works — second page returns remaining items', async () => {
    const page1 = await listUsers({ companyId: listCompanyId, offset: 0, limit: 2 });
    const page2 = await listUsers({ companyId: listCompanyId, offset: 2, limit: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(1);
    expect(page2.hasMore).toBe(false);

    // No overlapping ids
    const ids1 = page1.data.map((u) => u.id);
    const ids2 = page2.data.map((u) => u.id);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
  });

  describe('search parameter', () => {
    it('filters results by partial email match', async () => {
      const result = await listUsers({
        companyId: listCompanyId,
        offset: 0,
        limit: 10,
        search: 'list-user-1',
      });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('list-user-1@test.com');
    });

    it('returns empty data when search term matches no users', async () => {
      const result = await listUsers({
        companyId: listCompanyId,
        offset: 0,
        limit: 10,
        search: 'nonexistent-user',
      });

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it('matches partial strings within email (LIKE search)', async () => {
      const result = await listUsers({
        companyId: listCompanyId,
        offset: 0,
        limit: 10,
        search: '@test.com',
      });

      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
    });

    it('search respects pagination — applies limit and offset to filtered results', async () => {
      // Create additional users with searchable prefix
      const userRepo = ds.getRepository(User);
      for (let i = 4; i <= 6; i++) {
        await userRepo.save(
          userRepo.create({
            id: crypto.randomUUID(),
            companyId: listCompanyId,
            email: `search-test-${i}@example.com`,
            passwordHash: 'salthex:keyhex',
            role: 'manager',
          } as Partial<User>),
        );
      }

      // Fetch first page of search-test users (limit 2)
      const page1 = await listUsers({
        companyId: listCompanyId,
        offset: 0,
        limit: 2,
        search: 'search-test',
      });

      expect(page1.total).toBe(3);
      expect(page1.data).toHaveLength(2);
      expect(page1.hasMore).toBe(true);

      // Fetch second page
      const page2 = await listUsers({
        companyId: listCompanyId,
        offset: 2,
        limit: 2,
        search: 'search-test',
      });

      expect(page2.total).toBe(3);
      expect(page2.data).toHaveLength(1);
      expect(page2.hasMore).toBe(false);

      // Verify no overlapping ids between pages
      const ids1 = page1.data.map((u) => u.id);
      const ids2 = page2.data.map((u) => u.id);
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });

    it('search is isolated per company — does not return users from other companies with matching emails', async () => {
      // Create a second company with a user that has a searchable string
      const otherCompany = await seedCompany(ds, { name: 'Search Test Corp' });
      await seedUser(ds, {
        companyId: otherCompany.id,
        email: 'search-match@example.com',
        role: 'manager',
      });

      // Search in listCompanyId should not find the user from otherCompany
      const result = await listUsers({
        companyId: listCompanyId,
        offset: 0,
        limit: 10,
        search: 'search-match',
      });

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });
});
