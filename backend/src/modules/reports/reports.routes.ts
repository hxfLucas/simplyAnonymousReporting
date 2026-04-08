import { Router } from 'express';
import ensureAdmin from '../../shared/middleware/ensureAdmin';
import ensureManager from '../../shared/middleware/ensureManager';
import { createRateLimiter } from '../../shared/middleware/rateLimiter';
import { validateReportHandler, submitReportHandler, listReportsHandler, deleteReportHandler, updateReportStatusHandler } from './reports.handler';
import { validateBody } from '../../shared/middleware/validateBody';
import { SubmitReportDto, UpdateReportStatusDto } from './reports.dtos';

const router = Router();

const submitReportLimiter = createRateLimiter({ windowMs: 60000, max: 1 });

// Public routes (no authentication)
router.get('/validate-report', validateReportHandler);
router.post('/submit-report', submitReportLimiter, submitReportHandler);

// Manager-accessible routes
router.get('/list', ensureManager, listReportsHandler);
router.patch('/update-report-status', ensureManager, updateReportStatusHandler);

// Admin-only routes
router.delete('/delete-report/:id', ensureAdmin, deleteReportHandler);

export default router;
