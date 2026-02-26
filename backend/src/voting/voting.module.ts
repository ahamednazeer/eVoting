import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote, Voter, Candidate, Election } from '../entities';
import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';

@Module({
    imports: [TypeOrmModule.forFeature([Vote, Voter, Candidate, Election])],
    controllers: [VotingController],
    providers: [VotingService],
    exports: [VotingService],
})
export class VotingModule { }
