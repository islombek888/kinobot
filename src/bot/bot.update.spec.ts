import { Test, TestingModule } from '@nestjs/testing';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { Context } from 'telegraf';

describe('BotUpdate', () => {
    let update: BotUpdate;
    let botService: BotService;

    const mockBotService = {
        isAdmin: jest.fn(),
        findMovieByCode: jest.fn(),
        addMovie: jest.fn(),
        getStats: jest.fn(),
    };

    const mockCtx = {
        from: { id: 123, username: 'testuser' },
        message: { text: '123' },
        replyWithHTML: jest.fn(),
        sendSticker: jest.fn(),
        sendVideo: jest.fn(),
    } as unknown as Context;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BotUpdate,
                { provide: BotService, useValue: mockBotService },
            ],
        }).compile();

        update = module.get<BotUpdate>(BotUpdate);
        botService = module.get<BotService>(BotService);
    });

    it('should be defined', () => {
        expect(update).toBeDefined();
    });

    describe('onStart', () => {
        it('should send welcome message', async () => {
            await update.onStart(mockCtx);
            expect(mockCtx.replyWithHTML).toHaveBeenCalledWith(expect.stringContaining('Assalomu alaykum'));
        });
    });

    describe('onMessage - Search', () => {
        it('should send video if movie found', async () => {
            const movie = { code: '123', title: 'Test', fileId: 'vid123' };
            mockBotService.findMovieByCode.mockResolvedValue(movie);

            const ctx = {
                ...mockCtx,
                message: { text: '123' },
            } as unknown as Context;

            await update.onMessage(ctx);
            expect(mockBotService.findMovieByCode).toHaveBeenCalledWith('123');
            expect(ctx.sendVideo).toHaveBeenCalled();
        });

        it('should reply not found if movie missing', async () => {
            mockBotService.findMovieByCode.mockResolvedValue(null);

            const ctx = {
                ...mockCtx,
                message: { text: '999' },
            } as unknown as Context;

            await update.onMessage(ctx);
            expect(ctx.replyWithHTML).toHaveBeenCalledWith(expect.stringContaining('topilmadi'));
        });
    });
});
