import { Request, Response } from 'express'
import { getAuthenticatedUserData } from '../../shared/auth/authContext'
import { listByCompany, createMagicLink, deleteById } from './magiclinks.service'
import { CreateMagicLinkDto, MagicLinkResponseDto, ListMagicLinksResponseDto } from './magiclinks.dtos'
import { ErrorResponseDto } from '../../shared/errors/errorResponse.dto'


export async function listMagicLinks(req: Request, res: Response<ListMagicLinksResponseDto | ErrorResponseDto>): Promise<void> {
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

export async function createNewMagicLink(req: Request<{}, MagicLinkResponseDto, CreateMagicLinkDto>, res: Response<MagicLinkResponseDto | ErrorResponseDto>): Promise<void> {
  const { companyId, id: createdById } = getAuthenticatedUserData();
  const { alias } = req.body
  const created = await createMagicLink(companyId, alias, createdById);
  res.status(201).json({
    id: created.id,
    reportingToken: created.reportingToken,
    alias: created.alias,
    companyId: created.companyId,
    createdById: created.createdById,
    createdAt: created.createdAt,
    createdBy: created.createdBy
      ? { id: created.createdBy.id, email: created.createdBy.email }
      : null,
  })
}

export async function deleteMagicLink(req: Request<{ id: string }>, res: Response<ErrorResponseDto>): Promise<void> {
  const { id: linkId } = req.params
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
