import { Router } from 'express'
import { createNewMagicLink, deleteMagicLink } from './magiclinks.handler'
import ensureManager from '../../shared/middleware/ensureManager'

const router = Router()

router.post('/create-new-magiclink', ensureManager, createNewMagicLink)
router.delete('/delete-magiclink/:id', ensureManager, deleteMagicLink)

export default router
