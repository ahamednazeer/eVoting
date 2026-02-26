import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: () => "datetime('now')" })
  created_at: string;
}
