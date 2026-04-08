import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { createTestDataSource } from '../../../shared/test-helpers/createTestDataSource'
import { runWithTestAuth } from '../../../shared/test-helpers/runWithTestAuth'
import { seedCompany, seedUser } from '../../../shared/test-helpers/seeders'
import { makeAdminAuth, makeManagerAuth } from '../../../shared/test-helpers/authFactories'
import { UUID_REGEX } from '../../../shared/test-helpers/constants'
import { listByCompany, createMagicLink, deleteById } from '../magiclinks.service'
import { MagicLink } from '../magiclinks.entity'

let ds: DataSource

// Seeded identifiers filled in beforeAll
let company1Id: string
let company2Id: string
let adminUser1Id: string
let managerUser1Id: string
let adminUser2Id: string

beforeAll(async () => {
  ds = await createTestDataSource()

  const company1 = await seedCompany(ds, { name: 'Company One' })
  company1Id = company1.id

  const company2 = await seedCompany(ds, { name: 'Company Two' })
  company2Id = company2.id

  const admin1 = await seedUser(ds, { companyId: company1Id, email: 'admin1@example.com', role: 'admin' })
  adminUser1Id = admin1.id

  const manager1 = await seedUser(ds, { companyId: company1Id, email: 'manager1@example.com', role: 'manager' })
  managerUser1Id = manager1.id

  const admin2 = await seedUser(ds, { companyId: company2Id, email: 'admin2@example.com', role: 'admin' })
  adminUser2Id = admin2.id
})

afterAll(async () => {
  if (ds?.isInitialized) {
    await ds.destroy()
  }
})

describe('createMagicLink', () => {
  it('creates a magic link with a UUID reportingToken', async () => {
    const link = await runWithTestAuth(
      makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
      () => createMagicLink(company1Id, null, adminUser1Id)
    )

    expect(link).toBeDefined()
    expect(link.reportingToken).toMatch(UUID_REGEX)
    expect(link.companyId).toBe(company1Id)
    expect(link.alias).toBeNull()
    expect(link.createdById).toBe(adminUser1Id)
  })

  it('creates a magic link with an alias', async () => {
    const link = await runWithTestAuth(
      makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
      () => createMagicLink(company1Id, 'My Alias', adminUser1Id)
    )

    expect(link.alias).toBe('My Alias')
  })

  it('creates a magic link without an alias', async () => {
    const link = await runWithTestAuth(
      makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
      () => createMagicLink(company1Id, undefined, adminUser1Id)
    )

    expect(link.alias).toBeNull()
  })
})

describe('listByCompany', () => {
  it('returns paginated result scoped to companyId', async () => {
    // Create links for both companies
    await runWithTestAuth(
      makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
      () => createMagicLink(company1Id, 'Company1 Link', adminUser1Id)
    )
    await runWithTestAuth(
      makeAdminAuth({ id: adminUser2Id, companyId: company2Id }),
      () => createMagicLink(company2Id, 'Company2 Link', adminUser2Id)
    )

    const result = await runWithTestAuth(
      makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
      () => listByCompany(company1Id)
    )

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('hasMore')

    // All returned links belong to company1
    result.data.forEach((link: MagicLink) => {
      expect(link.companyId).toBe(company1Id)
    })
  })

  it('returns correct total and hasMore with pagination', async () => {
    // Reset by using a fresh company for isolation
    const paginationCompany = await seedCompany(ds, { name: 'Pagination Company' })
    const pagCompanyId = paginationCompany.id

    const pagUser = await seedUser(ds, { companyId: pagCompanyId, email: 'paguser@example.com', role: 'admin' })

    // Create 3 links
    for (let i = 0; i < 3; i++) {
      await runWithTestAuth(
        makeAdminAuth({ id: pagUser.id, companyId: pagCompanyId }),
        () => createMagicLink(pagCompanyId, `Link ${i}`, pagUser.id)
      )
    }

    const firstPage = await runWithTestAuth(
      makeAdminAuth({ id: pagUser.id, companyId: pagCompanyId }),
      () => listByCompany(pagCompanyId, 0, 2)
    )

    expect(firstPage.total).toBe(3)
    expect(firstPage.data).toHaveLength(2)
    expect(firstPage.hasMore).toBe(true)

    const secondPage = await runWithTestAuth(
      makeAdminAuth({ id: pagUser.id, companyId: pagCompanyId }),
      () => listByCompany(pagCompanyId, 2, 2)
    )

    expect(secondPage.total).toBe(3)
    expect(secondPage.data).toHaveLength(1)
    expect(secondPage.hasMore).toBe(false)
  })
})

describe('deleteById', () => {
  async function seedLink(companyId: string, createdById: string, alias?: string) {
    return runWithTestAuth(
      makeAdminAuth({ id: createdById, companyId }),
      () => createMagicLink(companyId, alias ?? null, createdById)
    )
  }

  it('admin can delete any magic link in their company', async () => {
    const link = await seedLink(company1Id, managerUser1Id, 'Admin Delete Test')

    await expect(
      runWithTestAuth(
        makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
        () => deleteById(link.id, company1Id, adminUser1Id, 'admin')
      )
    ).resolves.toBeUndefined()
  })

  it('manager can delete their own link', async () => {
    const link = await seedLink(company1Id, managerUser1Id, 'Manager Own Link')

    await expect(
      runWithTestAuth(
        makeManagerAuth({ id: managerUser1Id, companyId: company1Id }),
        () => deleteById(link.id, company1Id, managerUser1Id, 'manager')
      )
    ).resolves.toBeUndefined()
  })

  it('manager cannot delete another user\'s link (403)', async () => {
    const link = await seedLink(company1Id, adminUser1Id, 'Admin Created Link')

    let thrownError: any
    try {
      await runWithTestAuth(
        makeManagerAuth({ id: managerUser1Id, companyId: company1Id }),
        () => deleteById(link.id, company1Id, managerUser1Id, 'manager')
      )
    } catch (err) {
      thrownError = err
    }

    expect(thrownError).toBeDefined()
    expect(thrownError.status).toBe(403)
    expect(thrownError.code).toBe('FORBIDDEN')
  })

  it('throws 404 when the link does not belong to the requesting company', async () => {
    // Create a link for company2
    const link = await seedLink(company2Id, adminUser2Id, 'Company2 Link')

    let thrownError: any
    try {
      // Claim it belongs to company1 — should not be found
      await runWithTestAuth(
        makeAdminAuth({ id: adminUser1Id, companyId: company1Id }),
        () => deleteById(link.id, company1Id, adminUser1Id, 'admin')
      )
    } catch (err) {
      thrownError = err
    }

    expect(thrownError).toBeDefined()
    expect(thrownError.status).toBe(404)
    expect(thrownError.code).toBe('NOT_FOUND')
  })
})
