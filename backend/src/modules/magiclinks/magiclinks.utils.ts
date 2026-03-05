import { randomUUID } from 'crypto'
import { MagicLink } from './magiclinks.entity'

export async function generateMagicLinkData(): Promise<{ reportingToken: string }> {
  const uuid = randomUUID()
  return { reportingToken: uuid }
}

