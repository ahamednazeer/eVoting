import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voter } from '../entities';

@Injectable()
export class VotersService {
    constructor(
        @InjectRepository(Voter)
        private voterRepo: Repository<Voter>,
    ) { }

    async findByElection(electionId: string) {
        return this.voterRepo.find({
            where: { election_id: electionId },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string) {
        const voter = await this.voterRepo.findOne({ where: { id } });
        if (!voter) throw new NotFoundException('Voter not found');
        return voter;
    }

    async findByMobile(mobile: string) {
        return this.voterRepo.findOne({
            where: { mobile },
            relations: ['election'],
        });
    }

    async create(data: Partial<Voter>) {
        const voter = this.voterRepo.create(data);
        return this.voterRepo.save(voter);
    }

    async bulkCreate(voters: Partial<Voter>[]) {
        const entities = this.voterRepo.create(voters);
        return this.voterRepo.save(entities);
    }

    async update(id: string, data: Partial<Voter>) {
        const voter = await this.findOne(id);
        Object.assign(voter, data);
        return this.voterRepo.save(voter);
    }

    async remove(id: string) {
        const voter = await this.findOne(id);
        await this.voterRepo.remove(voter);
        return { message: 'Voter deleted' };
    }

    async markAsVoted(id: string) {
        const voter = await this.findOne(id);
        voter.has_voted = true;
        return this.voterRepo.save(voter);
    }

    async countByElection(electionId: string) {
        return this.voterRepo.count({ where: { election_id: electionId } });
    }

    async countVotedByElection(electionId: string) {
        return this.voterRepo.count({ where: { election_id: electionId, has_voted: true } });
    }
}
