import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { AdminGuard } from '../auth/jwt-auth.guard';

@Controller('api/results')
@UseGuards(AdminGuard)
export class ResultsController {
    constructor(private resultsService: ResultsService) { }

    @Get('dashboard')
    getDashboardStats() {
        return this.resultsService.getDashboardStats();
    }

    @Get(':electionId')
    getResults(@Param('electionId') electionId: string) {
        return this.resultsService.getResults(electionId);
    }
}
