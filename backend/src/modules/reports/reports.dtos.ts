import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from './reports.entity';

export class SubmitReportDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class UpdateReportStatusDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  status!: ReportStatus;
}

export interface ReportResponse {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListReportsResponse {
  data: ReportResponse[];
  total: number;
  hasMore: boolean;
}

export interface ValidateReportResponse {
  companyId: string;
  companyName: string;
}
