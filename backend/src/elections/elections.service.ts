import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Election, ElectionStatus } from '../entities';

@Injectable()
export class ElectionsService {
    constructor(
        @InjectRepository(Election)
        private electionRepo: Repository<Election>,
    ) { }

    async findAll() {
        return this.electionRepo.find({ order: { created_at: 'DESC' } });
    }

    async findOne(id: string) {
        const election = await this.electionRepo.findOne({ where: { id } });
        if (!election) throw new NotFoundException('Election not found');
        return election;
    }

    async create(data: Partial<Election>) {
        const election = this.electionRepo.create(data);
        return this.electionRepo.save(election);
    }

    async update(id: string, data: Partial<Election>) {
        const election = await this.findOne(id);
        Object.assign(election, data);
        return this.electionRepo.save(election);
    }

    async remove(id: string) {
        const election = await this.findOne(id);
        await this.electionRepo.remove(election);
        return { message: 'Election deleted' };
    }

    async start(id: string) {
        const election = await this.findOne(id);
        if (election.status === ElectionStatus.ACTIVE) {
            throw new BadRequestException('Election is already active');
        }
        if (election.status === ElectionStatus.COMPLETED) {
            throw new BadRequestException('Election is already completed');
        }
        election.status = ElectionStatus.ACTIVE;
        return this.electionRepo.save(election);
    }

    async end(id: string) {
        const election = await this.findOne(id);
        if (election.status !== ElectionStatus.ACTIVE) {
            throw new BadRequestException('Election is not active');
        }
        election.status = ElectionStatus.COMPLETED;
        return this.electionRepo.save(election);
    }
}
