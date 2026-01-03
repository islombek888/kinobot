"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotUpdate = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const bot_service_1 = require("./bot.service");
let BotUpdate = class BotUpdate {
    botService;
    REQUIRED_CHANNEL = '@xorazm_kino1';
    constructor(botService) {
        this.botService = botService;
    }
    async checkSubscription(ctx, userId) {
        try {
            const isAdmin = await this.botService.isAdmin(userId.toString());
            if (isAdmin)
                return true;
            const member = await ctx.telegram.getChatMember(this.REQUIRED_CHANNEL, userId);
            const allowedStates = ['creator', 'administrator', 'member', 'restricted'];
            return allowedStates.includes(member.status);
        }
        catch (error) {
            console.error(`[BotUpdate] Subscription check error for ${userId}: ${error.message}`);
            return false;
        }
    }
    async sendSubscriptionPrompt(ctx) {
        await ctx.replyWithHTML(`<b>⚠️ Botdan foydalanish uchun kanalimizga a'zo bo'lishingiz kerak!</b>\n\n` +
            `Iltimos, pastdagi kanalga obuna bo'ling va <b>"✅ Obunani tekshirish"</b> tugmasini bosing.`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.url("↗️ Kanalga a'zo bo'lish", `https://t.me/${this.REQUIRED_CHANNEL.replace('@', '')}`)],
            [telegraf_1.Markup.button.callback('✅ Obunani tekshirish', 'check_sub')],
        ]));
    }
    async onStart(ctx) {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        try {
            await this.botService.saveUser(userId.toString());
            const isSubscribed = await this.checkSubscription(ctx, userId);
            if (!isSubscribed) {
                await this.sendSubscriptionPrompt(ctx);
                return;
            }
            await this.sendWelcomeMessage(ctx);
        }
        catch (error) {
            console.error(`[BotUpdate] onStart error:`, error);
        }
    }
    async sendWelcomeMessage(ctx) {
        try {
            await ctx.sendSticker('CAACAgIAAxkBAAENID1nbBfM_U1O_8_8_8_8_8_8_8_8_8');
        }
        catch (e) { }
        await ctx.replyWithHTML('<b>🌟 Assalomu alaykum! Kino olamiga xush kelibsiz!</b>\n\n' +
            'Bu bot orqali siz istagan kinongizni soniyalar ichida topishingiz mumkin.\n\n' +
            '🔍 <b>Kino topish uchun:</b>\n' +
            'Shunchaki kino kodini yuboring 🔎\n\n' +
            '🎭 <b>Sizga maroqli hordiq tilaymiz!</b>');
    }
    async onCheckSub(ctx) {
        await ctx.answerCbQuery('✅ Rahmat!').catch(() => { });
        await ctx.deleteMessage().catch(() => { });
        await this.sendWelcomeMessage(ctx);
    }
    async onMessage(ctx) {
        const message = ctx.message;
        const text = message?.text;
        const userId = ctx.from?.id;
        if (!userId || !text)
            return;
        const trimmedText = text.trim();
        const isAdmin = await this.botService.isAdmin(userId.toString());
        if (isAdmin && trimmedText.startsWith('/add')) {
            const parts = trimmedText.split(/\s+/);
            if (parts.length < 3) {
                await ctx.replyWithHTML('⚠️ Format: <code>/add [kod] [nomi]</code> (Videoga javob bering)');
                return;
            }
            const code = parts[1];
            const title = parts.slice(2).join(' ');
            const replyMessage = message.reply_to_message;
            const fileId = replyMessage?.video?.file_id || replyMessage?.document?.file_id || replyMessage?.animation?.file_id;
            if (!fileId) {
                await ctx.replyWithHTML('📌 <b>Iltimos, videoga Reply qilib yozing!</b>');
                return;
            }
            try {
                await this.botService.addMovie(code, title, fileId);
                await ctx.replyWithHTML(`✅ <b>Qo'shildi:</b> ${title}\n🆔 <b>Kod:</b> <code>${code}</code>`);
            }
            catch (error) {
                await ctx.replyWithHTML('❌ Bazaga saqlashda xatolik!');
            }
            return;
        }
        if (trimmedText === '/stats' && isAdmin) {
            const { moviesCount, usersCount } = await this.botService.getStats();
            await ctx.replyWithHTML(`📊 <b>Statistika:</b>\n\n🎬 Kinolar: ${moviesCount}\n👤 Foydalanuvchilar: ${usersCount}`);
            return;
        }
        if (/^\d+$/.test(trimmedText)) {
            const movie = await this.botService.findMovieByCode(trimmedText);
            if (movie) {
                const channelMention = `<a href="https://t.me/${this.REQUIRED_CHANNEL.replace('@', '')}">${this.REQUIRED_CHANNEL}</a>`;
                await ctx.sendVideo(movie.fileId, {
                    caption: `🎬 <b>${movie.title}</b>\n\n` +
                        `🔑 <b>Kod:</b> <code>${movie.code}</code>\n\n` +
                        `🍿 <b>Kino kodlari kerak bo'lsa:</b>\n${channelMention}\n\n` +
                        `🎭 <b>Maroqli hordiq tilaymiz!</b>`,
                    parse_mode: 'HTML',
                }).catch(() => ctx.reply('❌ Videoni yuborishda xatolik!'));
            }
            else {
                await ctx.replyWithHTML('😔 <b>Kino topilmadi.</b>');
            }
        }
    }
};
exports.BotUpdate = BotUpdate;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStart", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('check_sub'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCheckSub", null);
__decorate([
    (0, nestjs_telegraf_1.On)('message'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMessage", null);
exports.BotUpdate = BotUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    __metadata("design:paramtypes", [bot_service_1.BotService])
], BotUpdate);
//# sourceMappingURL=bot.update.js.map