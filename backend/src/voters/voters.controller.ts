import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VotersService } from './voters.service';
import { AdminGuard } from '../auth/jwt-auth.guard';
import { CreateVoterDto } from '../dto';

@Controller('api/voters')
@UseGuards(AdminGuard)
export class VotersController {
    constructor(private votersService: VotersService) { }

    @Get()
    findByElection(@Query('election_id') electionId: string) {
        return this.votersService.findByElection(electionId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.votersService.findOne(id);
    }

    @Post()
    create(@Body() body: CreateVoterDto) {
        return this.votersService.create(body);
    }

    @Post('bulk')
    bulkCreate(@Body() body: { voters: CreateVoterDto[] }) {
        return this.votersService.bulkCreate(body.voters);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: CreateVoterDto) {
        return this.votersService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.votersService.remove(id);
    }
}
