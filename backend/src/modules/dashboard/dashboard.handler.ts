import { NextFunction, Request, Response } from 'express';
import { getDashboardStats } from './dashboard.service';
import { DashboardStatsDto } from './dashboard.dtos';
import { ErrorResponseDto } from '../../shared/errors/errorResponse.dto';

export async function dashboardFetchHandler(req: Request, res: Response<DashboardStatsDto>, next: NextFunction): Promise<void> {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
}
