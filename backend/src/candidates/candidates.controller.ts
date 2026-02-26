import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CandidatesService } from './candidates.service';
import { AdminGuard } from '../auth/jwt-auth.guard';

// Multer config for symbol images
const symbolStorage = diskStorage({
    destination: './uploads/symbols',
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `symbol-${uniqueSuffix}${ext}`);
    },
});

const imageFileFilter = (_req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
        return cb(new BadRequestException('Only image files are allowed (jpg, png, gif, webp, svg)'), false);
    }
    cb(null, true);
};

@Controller('api/candidates')
@UseGuards(AdminGuard)
export class CandidatesController {
    constructor(private candidatesService: CandidatesService) { }

    @Get()
    findByElection(@Query('election_id') electionId: string) {
        return this.candidatesService.findByElection(electionId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.candidatesService.findOne(id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('symbol', {
        storage: symbolStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    }))
    create(
        @Body() body: { name: string; party: string; constituency: string; election_id: string },
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const data: any = {
            name: body.name,
            party: body.party,
            constituency: body.constituency,
            election_id: body.election_id,
        };
        if (file) {
            data.symbol = `/uploads/symbols/${file.filename}`;
        }
        return this.candidatesService.create(data);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('symbol', {
        storage: symbolStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 2 * 1024 * 1024 },
    }))
    update(
        @Param('id') id: string,
        @Body() body: { name?: string; party?: string; constituency?: string; election_id?: string },
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const data: any = { ...body };
        if (body.election_id) data.election_id = body.election_id;
        if (file) {
            data.symbol = `/uploads/symbols/${file.filename}`;
        }
        return this.candidatesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.candidatesService.remove(id);
    }
}
