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
        console.log('[BotUpdate] BotUpdate instance initialized');
    }
    async checkSubscription(ctx, userId) {
        try {
            console.log(`[BotUpdate] Checking subscription for user ${userId}...`);
            const isAdmin = await this.botService.isAdmin(userId.toString());
            if (isAdmin) {
                console.log(`[BotUpdate] User ${userId} is admin, bypassing sub check`);
                return true;
            }
            console.log(`[BotUpdate] Calling getChatMember for ${userId} in ${this.REQUIRED_CHANNEL}`);
            const member = await ctx.telegram.getChatMember(this.REQUIRED_CHANNEL, userId);
            console.log(`[BotUpdate] getChatMember status for ${userId}: ${member.status}`);
            const allowedStates = ['creator', 'administrator', 'member', 'restricted'];
            return allowedStates.includes(member.status);
        }
        catch (error) {
            console.error(`[BotUpdate] Error checking subscription for ${userId}:`, error.message);
            return false;
        }
    }
    async sendSubscriptionPrompt(ctx) {
        await ctx.replyWithHTML(`<b>⚠️ Botdan foydalanish uchun kanalimizga a'zo bo'lishingiz kerak!</b>\n\n` +
            `Iltimos, pastdagi kanalga obuna bo'ling va <b>"✅ Obunani tekshirish"</b> tugmasini bosing.`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.url('↗️ Kanalga a\'zo bo\'lish', `https://t.me/${this.REQUIRED_CHANNEL.replace('@', '')}`)],
            [telegraf_1.Markup.button.callback('✅ Obunani tekshirish', 'check_sub')]
        ]));
        return;
    }
    async onStart(ctx) {
        const userId = ctx.from?.id;
        console.log(`[BotUpdate] /start command received from ${userId} (${ctx.from?.username || 'no username'})`);
        if (!userId) {
            console.log('[BotUpdate] userId is missing, skipping');
            return;
        }
        try {
            console.log(`[BotUpdate] Saving user ${userId} to DB...`);
            await this.botService.saveUser(userId.toString()).catch(err => {
                console.error(`[BotUpdate] Failed to save user ${userId}:`, err.message);
            });
            console.log(`[BotUpdate] User ${userId} checked/saved`);
            console.log(`[BotUpdate] Checking subscription for ${userId}...`);
            const isSubscribed = await this.checkSubscription(ctx, userId);
            console.log(`[BotUpdate] Subscription status for ${userId}: ${isSubscribed}`);
            if (!isSubscribed) {
                console.log(`[BotUpdate] Sending subscription prompt to ${userId}`);
                await this.sendSubscriptionPrompt(ctx);
                return;
            }
            console.log(`[BotUpdate] Sending welcome message to ${userId}`);
            await this.sendWelcomeMessage(ctx);
        }
        catch (error) {
            console.error(`[BotUpdate] Fatal error in onStart for ${userId}:`, error);
        }
        return;
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
        return;
    }
    async onCheckSub(ctx) {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        await ctx.answerCbQuery('✅ Rahmat! Endi botdan foydalanishingiz mumkin.').catch(() => { });
        await ctx.deleteMessage().catch(() => { });
        await this.sendWelcomeMessage(ctx);
        return;
    }
    async onMessage(ctx) {
        const message = ctx.message;
        const text = message?.text;
        const userId = ctx.from?.id;
        console.log(`[BotUpdate] Incoming message from ${userId}: "${text || '[non-text]'}"`);
        if (!userId || !text)
            return;
        const trimmedText = text.trim();
        const isAdmin = await this.botService.isAdmin(userId.toString());
        console.log(`[BotUpdate] User ${userId} isAdmin: ${isAdmin}`);
        if (isAdmin && trimmedText.startsWith('/add')) {
            console.log(`[BotUpdate] Admin ${userId} is adding a movie...`);
            const parts = trimmedText.split(/\s+/);
            if (parts.length < 3) {
                await ctx.replyWithHTML('⚠️ <b>Xato format!</b>\n\n' +
                    'To\'g\'ri foydalanish: <code>/add [kod] [nomi]</code>\n' +
                    '<i>(Videoga javob bergan holda yozing)</i>');
                return;
            }
            const code = parts[1];
            const title = parts.slice(2).join(' ');
            const replyMessage = message.reply_to_message;
            if (!replyMessage) {
                await ctx.replyWithHTML('📌 <b>Iltimos, videoga Reply (Javob) qilib yozing!</b>');
                return;
            }
            const fileId = replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;
            if (!fileId) {
                await ctx.replyWithHTML('🚫 <b>Hech qanday video yoki fayl topilmadi!</b>');
                return;
            }
            try {
                await this.botService.addMovie(code, title, fileId);
                try {
                    await ctx.sendSticker('CAACAgIAAxkBAAEL7ABmCAAB_8_8_8_8_8_8_8_8_8_8');
                }
                catch (e) { }
                await ctx.replyWithHTML('✅ <b>Kino muvaffaqiyatli qo\'shildi!</b>\n\n' +
                    `🎬 <b>Nomi:</b> ${title}\n` +
                    `🆔 <b>Kod:</b> <code>${code}</code>\n\n` +
                    '🚀 <i>Endi bu kodni yozgan har bir kishi kinoni ko\'ra oladi!</i>');
                console.log(`[BotUpdate] Movie ${code} added by admin ${userId}`);
                return;
            }
            catch (error) {
                console.error('[BotUpdate] Error adding movie:', error);
                await ctx.replyWithHTML('❌ <b>Bazaga saqlashda texnik xatolik yuz berdi!</b>');
                return;
            }
        }
        if (trimmedText === '/stats' && isAdmin) {
            const { moviesCount, usersCount } = await this.botService.getStats();
            await ctx.replyWithHTML('📊 <b>Bot Statistikasi:</b>\n\n' +
                `🎬 <b>Kinolar soni:</b> ${moviesCount}\n` +
                `👤 <b>Foydalanuvchilar:</b> ${usersCount}`);
            return;
        }
        if (/^\d+$/.test(trimmedText)) {
            console.log(`[BotUpdate] Searching for movie code: ${trimmedText}`);
            const movie = await this.botService.findMovieByCode(trimmedText);
            if (movie) {
                try {
                    await ctx.sendVideo(movie.fileId, {
                        caption: `🎬 <b>${movie.title}</b>\n\n🔑 <b>Kod:</b> <code>${movie.code}</code>\n\n🍿 <i>Yoqimli tomosha!</i>`,
                        parse_mode: 'HTML'
                    });
                }
                catch (error) {
                    console.error('Error sending video:', error);
                    await ctx.replyWithHTML('❌ <b>Kechirasiz, faylni yuborishda xatolik yuz berdi.</b>');
                }
            }
            else {
                console.log(`[BotUpdate] Movie not found for code: ${trimmedText}`);
                await ctx.replyWithHTML('😔 <b>Afsus, ushbu kod bilan kino topilmadi.</b>\n<i>Kodni to\'g\'ri yozganingizga ishonch hosil qiling!</i>');
            }
        }
        return;
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