import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Company } from '../companies/companies.entity';
import { ReportStatusHistory } from './report-status-history.entity';

export type ReportStatus = 'new' | 'in_review' | 'resolved' | 'rejected';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId!: string;

  @ManyToOne(() => Company, (company) => company.reports, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @Column({ type: 'varchar', nullable: false })
  status!: ReportStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => ReportStatusHistory, (statusHistory) => statusHistory.report)
  statusHistory!: ReportStatusHistory[];
}
