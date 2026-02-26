import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../entities';

@Injectable()
export class CandidatesService {
    constructor(
        @InjectRepository(Candidate)
        private candidateRepo: Repository<Candidate>,
    ) { }

    async findByElection(electionId: string) {
        return this.candidateRepo.find({
            where: { election_id: electionId },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string) {
        const candidate = await this.candidateRepo.findOne({ where: { id } });
        if (!candidate) throw new NotFoundException('Candidate not found');
        return candidate;
    }

    async create(data: Partial<Candidate>) {
        const candidate = this.candidateRepo.create(data);
        return this.candidateRepo.save(candidate);
    }

    async update(id: string, data: Partial<Candidate>) {
        const candidate = await this.findOne(id);
        Object.assign(candidate, data);
        return this.candidateRepo.save(candidate);
    }

    async remove(id: string) {
        const candidate = await this.findOne(id);
        await this.candidateRepo.remove(candidate);
        return { message: 'Candidate deleted' };
    }
}
