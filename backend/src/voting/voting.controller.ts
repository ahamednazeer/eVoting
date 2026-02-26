import { Controller, Post, Get, Body, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VotingService } from './voting.service';
import { VoterGuard } from '../auth/jwt-auth.guard';
import { CastVoteDto } from '../dto';

@Controller('api/vote')
@UseGuards(VoterGuard) // ALL voting endpoints require VOTER role
export class VotingController {
    constructor(private votingService: VotingService) { }

    @Get('candidates')
    getCandidates(
        @Request() req: any,
        @Query('election_id') electionId: string,
        @Query('constituency') constituency: string,
    ) {
        // Use voter's own election_id and constituency from JWT for security
        const voterElectionId = req.user.election_id || +electionId;
        const voterConstituency = req.user.constituency || constituency;
        return this.votingService.getCandidates(voterElectionId, voterConstituency);
    }

    // SECURITY: Extremely strict rate limit on vote casting — 1 per 60 seconds
    @Throttle({ default: { limit: 1, ttl: 60000 } })
    @Post('cast')
    castVote(@Request() req: any, @Body() body: CastVoteDto) {
        return this.votingService.castVote(req.user.sub, body.candidate_id, body.election_id);
    }
}
