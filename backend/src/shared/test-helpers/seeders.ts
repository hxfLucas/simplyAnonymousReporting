import { DataSource } from 'typeorm';
import { Company } from '../../modules/companies/companies.entity';
import { User } from '../../modules/users/users.entity';
import { MagicLink } from '../../modules/magiclinks/magiclinks.entity';

export interface SeededCompany {
  id: string;
  name: string;
}

export interface SeededUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

export async function seedCompany(
  ds: DataSource,
  overrides: Partial<Company> = {},
): Promise<SeededCompany> {
  const repo = ds.getRepository(Company);
  const company = repo.create({ name: 'Test Corp', ...overrides });
  const saved = await repo.save(company);
  return { id: saved.id, name: saved.name };
}

export async function seedUser(
  ds: DataSource,
  overrides: Partial<User> & { companyId: string },
): Promise<SeededUser> {
  const repo = ds.getRepository(User);
  const user = repo.create({
    email: 'user@test.com',
    passwordHash: 'salt:hash',
    role: 'admin',
    ...overrides,
  });
  const saved = await repo.save(user);
  return { id: saved.id, email: saved.email, role: saved.role, companyId: saved.companyId };
}

export async function seedMagicLink(
  ds: DataSource,
  overrides: Partial<MagicLink> & { companyId: string; createdById: string },
): Promise<MagicLink> {
  const repo = ds.getRepository(MagicLink);
  const link = repo.create({
    reportingToken: `test-token-${Date.now()}`,
    alias: null,
    ...overrides,
  });
  return repo.save(link);
}
