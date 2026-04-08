import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Company } from '../companies/companies.entity'
import { User } from '../users/users.entity'

@Entity('magic_links')
export class MagicLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true })
  reportingToken!: string

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company

  @Column({ type: 'varchar', nullable: true })
  alias!: string | null

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null

  @CreateDateColumn()
  createdAt!: Date
}
