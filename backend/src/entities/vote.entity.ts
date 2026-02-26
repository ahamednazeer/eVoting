import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from './candidate.entity';
import { Election } from './election.entity';

@Entity('votes')
export class Vote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    candidate_id: string;

    @Column()
    election_id: string;

    @Column({ default: () => "datetime('now')" })
    timestamp: string;

    @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @ManyToOne(() => Election, (election) => election.votes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'election_id' })
    election: Election;
}
