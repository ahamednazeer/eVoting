import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voter } from '../entities';
import { VotersController } from './voters.controller';
import { VotersService } from './voters.service';

@Module({
    imports: [TypeOrmModule.forFeature([Voter])],
    controllers: [VotersController],
    providers: [VotersService],
    exports: [VotersService],
})
export class VotersModule { }
