import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote, Candidate, Election, Voter } from '../entities';

@Injectable()
export class ResultsService {
    constructor(
        @InjectRepository(Vote)
        private voteRepo: Repository<Vote>,
        @InjectRepository(Candidate)
        private candidateRepo: Repository<Candidate>,
        @InjectRepository(Election)
        private electionRepo: Repository<Election>,
        @InjectRepository(Voter)
        private voterRepo: Repository<Voter>,
    ) { }

    async getResults(electionId: string) {
        const election = await this.electionRepo.findOne({ where: { id: electionId } });
        if (!election) throw new NotFoundException('Election not found');

        const candidates = await this.candidateRepo.find({
            where: { election_id: electionId },
        });

        const voteCounts = await this.voteRepo
            .createQueryBuilder('vote')
            .select('vote.candidate_id', 'candidate_id')
            .addSelect('COUNT(*)', 'vote_count')
            .where('vote.election_id = :electionId', { electionId })
            .groupBy('vote.candidate_id')
            .getRawMany();

        const voteMap = new Map(voteCounts.map((v) => [v.candidate_id, parseInt(v.vote_count)]));
        const isCompleted = election.status === 'COMPLETED';

        const results = candidates.map((c) => ({
            candidate_id: c.id,
            candidate_name: c.name,
            party: c.party,
            symbol: c.symbol,
            constituency: c.constituency,
            vote_count: isCompleted ? (voteMap.get(c.id) || 0) : 0,
        }));

        if (isCompleted) {
            results.sort((a, b) => b.vote_count - a.vote_count);
        }

        const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);
        const totalVoters = await this.voterRepo.count({ where: { election_id: electionId } });
        const votedVoters = await this.voterRepo.count({ where: { election_id: electionId, has_voted: true } });

        return {
            election: {
                id: election.id,
                name: election.name,
                status: election.status,
                constituency: election.constituency,
            },
            total_votes: totalVotes,
            total_voters: totalVoters,
            voted_voters: votedVoters,
            turnout_percentage: totalVoters > 0 ? ((votedVoters / totalVoters) * 100).toFixed(1) : '0',
            winner: isCompleted && results.length > 0 && results[0].vote_count > 0 ? results[0] : null,
            results,
        };
    }

    async getDashboardStats() {
        const totalElections = await this.electionRepo.count();
        const activeElections = await this.electionRepo.count({ where: { status: 'ACTIVE' as any } });
        const totalCandidates = await this.candidateRepo.count();
        const totalVoters = await this.voterRepo.count();
        const totalVotes = await this.voteRepo.count();

        return {
            total_elections: totalElections,
            active_elections: activeElections,
            total_candidates: totalCandidates,
            total_voters: totalVoters,
            total_votes: totalVotes,
        };
    }
}
