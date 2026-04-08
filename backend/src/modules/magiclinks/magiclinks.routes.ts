import { Router } from 'express'
import { createNewMagicLink, deleteMagicLink, listMagicLinks } from './magiclinks.handler'
import ensureManager from '../../shared/middleware/ensureManager'
import { validateBody } from '../../shared/middleware/validateBody'
import { CreateMagicLinkDto } from './magiclinks.dtos'

const router = Router()

router.get('/list', ensureManager, listMagicLinks)
router.post('/create-new-magiclink', ensureManager, createNewMagicLink)
router.delete('/delete-magiclink/:id', ensureManager, deleteMagicLink)

export default router
