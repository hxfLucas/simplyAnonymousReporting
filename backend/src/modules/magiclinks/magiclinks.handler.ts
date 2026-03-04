import { Request, Response } from 'express'
import { MagicLinksService } from './magiclinks.service'

const service = new MagicLinksService()

export async function createNewMagicLink(req: Request, res: Response): Promise<void> {
  const { companyId } = req.body as { companyId?: string }
  if (!companyId) {
    res.status(400).json({ error: 'companyId is required' })
    return
  }

  const link = await service.create(companyId)
  res.status(201).json(link)
}

export async function deleteMagicLink(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id?: string }
  if (!id) {
    res.status(400).json({ error: 'id is required' })
    return
  }

  await service.delete(id)
  res.status(204).send()
}
