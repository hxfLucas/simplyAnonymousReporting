import { Request, Response } from 'express';
import { deleteReport, listReports, submitReport, updateReportStatus, validateReportToken } from './reports.service';
import { SubmitReportDto, UpdateReportStatusDto, ReportResponseDto, ListReportsResponseDto, ValidateReportResponseDto } from './reports.dtos';
import { ErrorResponseDto } from '../../shared/errors/errorResponse.dto';

export async function validateReportHandler(req: Request<{}, ValidateReportResponseDto, {}, { token?: string }>, res: Response<ValidateReportResponseDto | ErrorResponseDto>) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const result = await validateReportToken(String(token));
  return res.json(result);
}

export async function submitReportHandler(req: Request<{}, ReportResponseDto, SubmitReportDto>, res: Response<ReportResponseDto | ErrorResponseDto>) {
  const { token, title, description } = req.body ?? {};
  if (!token || !title || !description) return res.status(400).json({ error: 'Missing fields' });

  const report = await submitReport({ token, title, description });
  return res.status(201).json(report);
}

export async function listReportsHandler(req: Request, res: Response<ListReportsResponseDto | ErrorResponseDto>) {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const result = await listReports(offset, limit);
  return res.json(result);
}

export async function deleteReportHandler(req: Request<{ id: string }>, res: Response<ErrorResponseDto>) {
  const id: string = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing report id' });

  await deleteReport(id);
  return res.status(204).send();
}

export async function updateReportStatusHandler(req: Request<{}, ReportResponseDto, UpdateReportStatusDto>, res: Response<ReportResponseDto | ErrorResponseDto>) {
  const { id, status } = req.body ?? {};
  if (!id || !status) return res.status(400).json({ error: 'Missing fields' });

  const updated = await updateReportStatus({ id, status });
  return res.json(updated);
}
