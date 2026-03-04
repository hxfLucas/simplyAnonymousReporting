import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/users.entity';
import { Report } from '../reports/reports.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @Column({ type: 'varchar', nullable: false })
  name!: string;

  

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => User, (user) => user.company)
  users!: User[];

  @OneToMany(() => Report, (report) => report.company)
  reports!: Report[];
}