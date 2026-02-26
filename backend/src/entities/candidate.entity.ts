import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Election } from './election.entity';

@Entity('candidates')
export class Candidate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    party: string;

    @Column({ nullable: true })
    symbol: string;

    @Column()
    constituency: string;

    @ManyToOne(() => Election, (election) => election.candidates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'election_id' })
    election: Election;

    @Column()
    election_id: string;
}
