import { Request, Response } from 'express';
import { ReportStatus } from './reports.entity';
import { deleteReport, listReports, submitReport, updateReportStatus, validateReportToken } from './reports.service';

export async function validateReportHandler(req: Request, res: Response) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const result = await validateReportToken(String(token));
  return res.json(result);
}

export async function submitReportHandler(req: Request, res: Response) {
  const { token, title, description } = req.body ?? {};
  if (!token || !title || !description) return res.status(400).json({ error: 'Missing fields' });

  const report = await submitReport({ token, title, description });
  return res.status(201).json(report);
}

export async function listReportsHandler(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const result = await listReports(offset, limit);
  return res.json(result);
}

export async function deleteReportHandler(req: Request<{ id: string }>, res: Response) {
  const id: string = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing report id' });

  await deleteReport(id);
  return res.status(204).send();
}

export async function updateReportStatusHandler(req: Request, res: Response) {
  const { id, status } = req.body ?? {};
  if (!id || !status) return res.status(400).json({ error: 'Missing fields' });

  const updated = await updateReportStatus({ id, status: status as ReportStatus });
  return res.json(updated);
}
