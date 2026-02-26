import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vote, Voter, Candidate, Election, ElectionStatus } from '../entities';

@Injectable()
export class VotingService {
    constructor(
        @InjectRepository(Vote)
        private voteRepo: Repository<Vote>,
        @InjectRepository(Voter)
        private voterRepo: Repository<Voter>,
        @InjectRepository(Candidate)
        private candidateRepo: Repository<Candidate>,
        @InjectRepository(Election)
        private electionRepo: Repository<Election>,
        private dataSource: DataSource,
    ) { }

    async getCandidates(electionId: string, constituency: string) {
        return this.candidateRepo.find({
            where: {
                election_id: electionId,
                constituency,
            },
            order: { name: 'ASC' },
        });
    }

    async castVote(voterId: string, candidateId: string, electionId: string) {
        // ═══════════════════════════════════════════════
        // SECURITY: Use a database TRANSACTION to prevent
        // race conditions (double-voting via concurrent requests)
        // ═══════════════════════════════════════════════
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        try {
            // ═══ SECURITY CHECK 1: Verify voter exists ═══
            const voter = await queryRunner.manager.findOne(Voter, {
                where: { id: voterId },
            });
            if (!voter) {
                throw new UnauthorizedException('Voter not found');
            }

            // ═══ SECURITY CHECK 2: Double-vote prevention ═══
            if (voter.has_voted) {
                throw new BadRequestException('You have already cast your vote');
            }

            // ═══ SECURITY CHECK 3: Voter belongs to this election ═══
            if (voter.election_id !== electionId) {
                throw new BadRequestException('You are not registered for this election');
            }

            // ═══ SECURITY CHECK 4: Election is active ═══
            const election = await queryRunner.manager.findOne(Election, {
                where: { id: electionId },
            });
            if (!election || election.status !== ElectionStatus.ACTIVE) {
                throw new BadRequestException('Election is not active');
            }

            // ═══ SECURITY CHECK 5: Candidate belongs to this election ═══
            const candidate = await queryRunner.manager.findOne(Candidate, {
                where: { id: candidateId, election_id: electionId },
            });
            if (!candidate) {
                throw new BadRequestException('Invalid candidate for this election');
            }

            // ═══ SECURITY CHECK 6: Candidate constituency matches voter ═══
            if (candidate.constituency !== voter.constituency) {
                throw new BadRequestException('Candidate is not from your constituency');
            }

            // ═══════════════════════════════════════════════
            // VOTE: Store vote anonymously (no voter_id stored)
            // Voter identity is NEVER linked to vote record
            // ═══════════════════════════════════════════════
            const vote = queryRunner.manager.create(Vote, {
                candidate_id: candidateId,
                election_id: electionId,
            });
            await queryRunner.manager.save(vote);

            // Mark voter as voted (separate from vote record)
            voter.has_voted = true;
            await queryRunner.manager.save(voter);

            // Commit both operations atomically
            await queryRunner.commitTransaction();

            console.log(`  [AUDIT] Vote cast in election ${electionId} at ${new Date().toISOString()}`);

            return { message: 'Vote successfully cast!' };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }

            console.error(' [ERROR] Vote casting failed:', error);
            throw new InternalServerErrorException('Failed to cast vote. Please try again.');
        } finally {
            await queryRunner.release();
        }
    }
}
