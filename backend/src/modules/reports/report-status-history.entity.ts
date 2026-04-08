import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Report, ReportStatus } from './reports.entity';
import { User } from '../users/users.entity';

@Entity('report_status_history')
export class ReportStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: false })
  reportId!: string;

  @ManyToOne(() => Report, (report) => report.statusHistory, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @Column({ name: 'old_status', type: 'varchar', nullable: false })
  oldStatus!: ReportStatus;

  @Column({ name: 'new_status', type: 'varchar', nullable: false })
  newStatus!: ReportStatus;

  @Column({ name: 'changed_by', type: 'uuid', nullable: false })
  changedBy!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by' })
  changedByUser!: User;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp' })
  changedAt!: Date;
}
