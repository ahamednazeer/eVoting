import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsUUID } from 'class-validator';

// ═══════════════════════════════════════════════
// Auth DTOs
// ═══════════════════════════════════════════════
export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'Username must be at least 3 characters' })
    @MaxLength(50)
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @MaxLength(100)
    password: string;
}

// ═══════════════════════════════════════════════
// Election DTOs
// ═══════════════════════════════════════════════
export class CreateElectionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @IsString()
    @IsNotEmpty()
    start_date: string;

    @IsString()
    @IsNotEmpty()
    end_date: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    constituency: string;
}

export class UpdateElectionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name?: string;

    @IsString()
    start_date?: string;

    @IsString()
    end_date?: string;

    @IsString()
    @MaxLength(200)
    constituency?: string;
}

// ═══════════════════════════════════════════════
// Candidate DTOs
// ═══════════════════════════════════════════════
export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    party: string;

    @IsString()
    @MaxLength(50)
    symbol?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    constituency: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    election_id: string;
}

// ═══════════════════════════════════════════════
// Voter DTOs
// ═══════════════════════════════════════════════
export class CreateVoterDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    voter_id_number: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{10,15}$/, { message: 'Mobile number must be 10-15 digits' })
    mobile: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    constituency: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    election_id: string;
}

// ═══════════════════════════════════════════════
// OTP DTOs
// ═══════════════════════════════════════════════
export class SendOtpDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{10,15}$/, { message: 'Mobile number must be 10-15 digits' })
    mobile: string;
}

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{10,15}$/, { message: 'Mobile number must be 10-15 digits' })
    mobile: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{4}$/, { message: 'OTP must be exactly 4 digits' })
    otp: string;
}

// ═══════════════════════════════════════════════
// Voting DTOs
// ═══════════════════════════════════════════════
export class CastVoteDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    candidate_id: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    election_id: string;
}
