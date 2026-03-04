import { Router } from 'express';
import ensureAdmin from '../../shared/middleware/ensureAdmin';
import ensureManager from '../../shared/middleware/ensureManager';
import { validateReportHandler, submitReportHandler, listReportsHandler, deleteReportHandler, updateReportStatusHandler } from './reports.handler';

const router = Router();

// Public routes (no authentication)
router.get('/validate-report', validateReportHandler);
router.post('/submit-report', submitReportHandler);

// Manager-accessible routes
router.get('/list', ensureManager, listReportsHandler);
router.patch('/update-report-status', ensureManager, updateReportStatusHandler);

// Admin-only routes
router.delete('/delete-report/:id', ensureAdmin, deleteReportHandler);

export default router;
