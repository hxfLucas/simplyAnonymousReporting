import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMagicLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  alias?: string;
}

export interface MagicLinkCreatorResponse {
  id: string;
  email: string;
}

export interface MagicLinkResponse {
  id: string;
  reportingToken: string;
  alias: string | null;
  companyId: string;
  createdById: string | null;
  createdAt: Date;
  createdBy: MagicLinkCreatorResponse | null;
}

export interface ListMagicLinksResponse {
  data: MagicLinkResponse[];
  total: number;
  hasMore: boolean;
}
