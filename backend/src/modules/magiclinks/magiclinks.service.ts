import crypto from 'crypto'
import { AppDataSource } from '../../shared/database/data-source'
import { MagicLink } from './magiclinks.entity'
import { Company } from '../companies/companies.entity'

export class MagicLinksService {
  private repo = AppDataSource.getRepository(MagicLink)

  async create(companyId: string): Promise<MagicLink> {
    const reportingToken = crypto.randomBytes(24).toString('hex')
    const link = this.repo.create({
      reportingToken,
      company: ({ id: companyId } as unknown) as Company,
    })
    return await this.repo.save(link)
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
