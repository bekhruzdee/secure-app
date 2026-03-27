import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SecurityEventType } from './security-event-type.enum';

@Entity('security_events')
@Index(['type', 'createdAt'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: SecurityEventType;

  @Column({ type: 'varchar', length: 15, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 500 })
  path: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  reason: string | null;

  @Column({ name: 'payload_snippet', type: 'text', nullable: true })
  payloadSnippet: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
