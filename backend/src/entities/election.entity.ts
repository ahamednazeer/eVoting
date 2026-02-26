import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Candidate } from './candidate.entity';
import { Voter } from './voter.entity';
import { Vote } from './vote.entity';

export enum ElectionStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
}

@Entity('elections')
export class Election {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    start_date: string;

    @Column()
    end_date: string;

    @Column()
    constituency: string;

    @Column({ type: 'text', default: ElectionStatus.INACTIVE })
    status: ElectionStatus;

    @Column({ default: () => "datetime('now')" })
    created_at: string;

    @OneToMany(() => Candidate, (candidate) => candidate.election)
    candidates: Candidate[];

    @OneToMany(() => Voter, (voter) => voter.election)
    voters: Voter[];

    @OneToMany(() => Vote, (vote) => vote.election)
    votes: Vote[];
}
