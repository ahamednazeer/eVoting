import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Election } from '../entities';
import { ElectionsController } from './elections.controller';
import { ElectionsService } from './elections.service';

@Module({
    imports: [TypeOrmModule.forFeature([Election])],
    controllers: [ElectionsController],
    providers: [ElectionsService],
    exports: [ElectionsService],
})
export class ElectionsModule { }
