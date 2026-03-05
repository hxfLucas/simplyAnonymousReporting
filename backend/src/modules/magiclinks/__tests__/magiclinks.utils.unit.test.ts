import { generateMagicLinkData } from '../magiclinks.utils'
import { MagicLink } from '../magiclinks.entity'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('generateMagicLinkData', () => {
  it('returns an object with a reportingToken matching UUID format', async () => {
    const result = await generateMagicLinkData()
    expect(result).toHaveProperty('reportingToken')
    expect(result.reportingToken).toMatch(UUID_REGEX)
  })

  it('returns a different token on each call', async () => {
    const first = await generateMagicLinkData()
    const second = await generateMagicLinkData()
    expect(first.reportingToken).not.toBe(second.reportingToken)
  })
})


