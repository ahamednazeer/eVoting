import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Election } from './election.entity';

@Entity('voters')
export class Voter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    voter_id_number: string;

    @Column()
    mobile: string;

    @Column()
    constituency: string;

    @Column({ default: false })
    has_voted: boolean;

    @ManyToOne(() => Election, (election) => election.voters, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'election_id' })
    election: Election;

    @Column()
    election_id: string;
}
