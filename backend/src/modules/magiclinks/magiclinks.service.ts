import { randomUUID } from 'node:crypto'
import { getAppDataSource } from '../../shared/database/data-source'
import { MagicLink } from './magiclinks.entity'
import { generateMagicLinkData } from './magiclinks.utils'

export async function listByCompany(companyId: string, offset: number = 0, limit: number = 25): Promise<{ data: MagicLink[]; total: number; hasMore: boolean }> {
  const repo = getAppDataSource().getRepository(MagicLink)
  const [items, total] = await repo.findAndCount({
    where: { companyId },
    relations: ['createdBy'],
    order: { createdAt: 'DESC' },
    skip: offset,
    take: limit,
  })
  return { data: items, total, hasMore: offset + items.length < total }
}

export async function createMagicLink(companyId: string, alias?: string | null, createdById?: string | null): Promise<MagicLink> {
  const repo = getAppDataSource().getRepository(MagicLink)
  const magicLinkData = await generateMagicLinkData()

  const entity = repo.create({
    reportingToken: magicLinkData.reportingToken,
    company: { id: companyId } as any,
    alias: alias ?? null,
    createdBy: createdById ? { id: createdById } as any : null,
  } as Partial<MagicLink>)

  const saved = await repo.save(entity)
  const withRelation = await repo.findOne({ where: { id: saved.id }, relations: ['createdBy'] })
  return withRelation ?? saved
}

export async function deleteById(id: string, companyId: string, userId: string, role: string): Promise<void> {
  const repo = getAppDataSource().getRepository(MagicLink)

  const link = await repo.findOne({ where: { id, companyId } })

  if (!link) {
    const err: any = new Error('Magic link not found')
    err.code = 'NOT_FOUND'
    err.status = 404
    throw err
  }

  if (role !== 'admin' && link.createdById !== userId) {
    const err: any = new Error('Forbidden')
    err.status = 403
    err.code = 'FORBIDDEN'
    throw err
  }

  await repo.remove(link)
}

export default { listByCompany, createMagicLink, deleteById }
