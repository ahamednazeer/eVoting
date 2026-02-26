import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { AdminGuard } from '../auth/jwt-auth.guard';
import { CreateElectionDto, UpdateElectionDto } from '../dto';

@Controller('api/elections')
@UseGuards(AdminGuard)
export class ElectionsController {
    constructor(private electionsService: ElectionsService) { }

    @Get()
    findAll() {
        return this.electionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.electionsService.findOne(id);
    }

    @Post()
    create(@Body() body: CreateElectionDto) {
        return this.electionsService.create(body);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: UpdateElectionDto) {
        return this.electionsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.electionsService.remove(id);
    }

    @Post(':id/start')
    start(@Param('id') id: string) {
        return this.electionsService.start(id);
    }

    @Post(':id/end')
    end(@Param('id') id: string) {
        return this.electionsService.end(id);
    }
}
