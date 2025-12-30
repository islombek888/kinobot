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
        answerCbQuery: jest.fn().mockReturnValue({ catch: jest.fn() }),
        deleteMessage: jest.fn().mockReturnValue({ catch: jest.fn() }),
        telegram: {
            getChatMember: jest.fn(),
        },
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

        // Default: not admin
        mockBotService.isAdmin.mockResolvedValue(false);
    });

    it('should be defined', () => {
        expect(update).toBeDefined();
    });

    describe('onStart', () => {
        it('should send subscription prompt if not subscribed', async () => {
            (mockCtx.telegram.getChatMember as jest.Mock).mockResolvedValue({ status: 'left' });
            await update.onStart(mockCtx);
            expect(mockCtx.replyWithHTML).toHaveBeenCalledWith(expect.stringContaining('obuna bo\'lishingiz kerak'), expect.anything());
        });

        it('should send welcome message if subscribed', async () => {
            (mockCtx.telegram.getChatMember as jest.Mock).mockResolvedValue({ status: 'member' });
            await update.onStart(mockCtx);
            expect(mockCtx.replyWithHTML).toHaveBeenCalledWith(expect.stringContaining('Assalomu alaykum'), expect.anything());
        });
    });

    describe('onCheckSub', () => {
        it('should always let user through and show welcome message', async () => {
            await update.onCheckSub(mockCtx);
            expect(mockCtx.answerCbQuery).toHaveBeenCalled();
            expect(mockCtx.replyWithHTML).toHaveBeenCalledWith(expect.stringContaining('Assalomu alaykum'), expect.anything());
        });
    });

    describe('onMessage - Search', () => {
        it('should send video if movie found (even if not verified)', async () => {
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
    });
});
