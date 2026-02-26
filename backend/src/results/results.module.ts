import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote, Candidate, Election, Voter } from '../entities';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
    imports: [TypeOrmModule.forFeature([Vote, Candidate, Election, Voter])],
    controllers: [ResultsController],
    providers: [ResultsService],
    exports: [ResultsService],
})
export class ResultsModule { }
