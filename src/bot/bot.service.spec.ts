import { Test, TestingModule } from '@nestjs/testing';
import { BotService } from './bot.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BotService', () => {
    let service: BotService;
    let prisma: PrismaService;

    const mockPrismaService = {
        movie: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BotService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<BotService>(BotService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findMovieByCode', () => {
        it('should return a movie if found', async () => {
            const movie = { code: '123', title: 'Test Movie', fileId: 'file123' };
            mockPrismaService.movie.findUnique.mockResolvedValue(movie);

            const result = await service.findMovieByCode('123');
            expect(result).toEqual(movie);
            expect(prisma.movie.findUnique).toHaveBeenCalledWith({ where: { code: '123' } });
        });
    });

    describe('isAdmin', () => {
        it('should return true if user is admin in DB', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ isAdmin: true });
            const result = await service.isAdmin('456');
            expect(result).toBe(true);
        });

        it('should return true if user is default admin from env', async () => {
            process.env.ADMIN_ID = '789';
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            const result = await service.isAdmin('789');
            expect(result).toBe(true);
        });
    });

    describe('getStats', () => {
        it('should return correct stats', async () => {
            mockPrismaService.movie.count.mockResolvedValue(10);
            mockPrismaService.user.count.mockResolvedValue(5);
            const result = await service.getStats();
            expect(result).toEqual({ moviesCount: 10, usersCount: 5 });
        });
    });
});
