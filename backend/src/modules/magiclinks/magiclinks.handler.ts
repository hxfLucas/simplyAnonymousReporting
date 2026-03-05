import { Request, Response } from 'express'
import { getAuthenticatedUserData } from '../../shared/auth/authContext'
import { listByCompany, createMagicLink, deleteById } from './magiclinks.service'


export async function listMagicLinks(req: Request, res: Response): Promise<void> {
  const companyId = getAuthenticatedUserData().companyId;
  if (!companyId) {
    res.status(400).json({ error: 'companyId is required' })
    return
  }
  const limit = Math.min(Number(req.query.limit) || 25, 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const result = await listByCompany(companyId, offset, limit)
  res.status(200).json(result)
}

export async function createNewMagicLink(req: Request, res: Response): Promise<void> {
  const { companyId, id: createdById } = getAuthenticatedUserData();
  if (!companyId) {
    res.status(400).json({ error: 'companyId is required' })
    return
  }
  const { alias } = req.body as { alias?: string }
  const created = await createMagicLink(companyId, alias, createdById);
  res.status(201).json({ id: created.id, reportingToken: created.reportingToken, alias: created.alias, createdById: created.createdById, createdAt: created.createdAt, createdBy: { ...created.createdBy } })
}

export async function deleteMagicLink(req: Request, res: Response): Promise<void> {
  const { id: linkId } = req.params as { id?: string }
  if (!linkId) {
    res.status(400).json({ error: 'id is required' })
    return
  }
  const { companyId, id, role } = getAuthenticatedUserData()
  if (!companyId) {
    res.status(400).json({ error: 'companyId is required' })
    return
  }

  await deleteById(linkId, companyId, id, role)
  res.status(204).send()
}
