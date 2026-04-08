import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMagicLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  alias?: string;
}

export interface MagicLinkCreatorResponseDto {
  id: string;
  email: string;
}

export interface MagicLinkResponseDto {
  id: string;
  reportingToken: string;
  alias: string | null;
  companyId: string;
  createdById: string | null;
  createdAt: Date;
  createdBy: MagicLinkCreatorResponseDto | null;
}

export interface ListMagicLinksResponseDto {
  data: MagicLinkResponseDto[];
  total: number;
  hasMore: boolean;
}
