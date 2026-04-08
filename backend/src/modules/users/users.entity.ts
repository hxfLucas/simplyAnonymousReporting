import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../companies/companies.entity';

export type UserRole = 'admin' | 'manager';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId!: string;

  @ManyToOne(() => Company, (company) => company.users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: false })
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: false })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
