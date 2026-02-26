import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../entities';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
    imports: [TypeOrmModule.forFeature([Candidate])],
    controllers: [CandidatesController],
    providers: [CandidatesService],
    exports: [CandidatesService],
})
export class CandidatesModule { }
