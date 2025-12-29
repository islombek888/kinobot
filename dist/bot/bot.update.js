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
    constructor(botService) {
        this.botService = botService;
    }
    async onStart(ctx) {
        try {
            await ctx.sendSticker('CAACAgIAAxkBAAEL6_FmB_yP8_8_8_8_8_8_8_8_8_8_8');
        }
        catch (e) { }
        await ctx.replyWithHTML('<b>🌟 Assalomu alaykum! Kino olamiga xush kelibsiz!</b>\n\n' +
            'Bu bot orqali siz istagan kinongizni soniyalar ichida topishingiz mumkin.\n\n' +
            '🔍 <b>Kino topish uchun:</b>\n' +
            'Shunchaki kino kodini yuboring (Masalan: <code>44</code>)\n\n' +
            '🎭 <b>Sizga maroqli hordiq tilaymiz!</b>');
    }
    async onMessage(ctx) {
        const message = ctx.message;
        const text = message?.text;
        const userId = ctx.from?.id.toString();
        if (!userId || !text)
            return;
        if (text.startsWith('/add')) {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin)
                return;
            const parts = text.split(' ');
            if (parts.length < 3) {
                return ctx.replyWithHTML('⚠️ <b>Xato format!</b>\n\n' +
                    'To\'g\'ri foydalanish: <code>/add [kod] [nomi]</code>\n' +
                    '<i>(Videoga javob bergan holda yozing)</i>');
            }
            const code = parts[1];
            const title = parts.slice(2).join(' ');
            const replyMessage = message.reply_to_message;
            if (!replyMessage) {
                return ctx.replyWithHTML('📌 <b>Iltimos, videoga Reply (Javob) qilib yozing!</b>');
            }
            const fileId = replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;
            if (!fileId) {
                return ctx.replyWithHTML('🚫 <b>Hech qanday video yoki fayl topilmadi!</b>');
            }
            try {
                await this.botService.addMovie(code, title, fileId);
                try {
                    await ctx.sendSticker('CAACAgIAAxkBAAEL7ABmCAAB_8_8_8_8_8_8_8_8_8_8');
                }
                catch (e) { }
                return ctx.replyWithHTML('✅ <b>Kino muvaffaqiyatli qo\'shildi!</b>\n\n' +
                    `🎬 <b>Nomi:</b> ${title}\n` +
                    `🆔 <b>Kod:</b> <code>${code}</code>\n\n` +
                    '🚀 <i>Endi bu kodni yozgan har bir kishi kinoni ko\'ra oladi!</i>');
            }
            catch (error) {
                console.error('Error adding movie:', error);
                return ctx.replyWithHTML('❌ <b>Bazaga saqlashda texnik xatolik yuz berdi!</b>');
            }
        }
        if (text === '/stats') {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin)
                return;
            const { moviesCount, usersCount } = await this.botService.getStats();
            return ctx.replyWithHTML('📊 <b>Bot Statistikasi:</b>\n\n' +
                `🎬 <b>Kinolar soni:</b> ${moviesCount}\n` +
                `👤 <b>Foydalanuvchilar:</b> ${usersCount}`);
        }
        if (/^\d+$/.test(text)) {
            const movie = await this.botService.findMovieByCode(text);
            if (movie) {
                try {
                    return await ctx.sendVideo(movie.fileId, {
                        caption: `🎬 <b>${movie.title}</b>\n\n🔑 <b>Kod:</b> <code>${movie.code}</code>\n\n🍿 <i>Yoqimli tomosha!</i>`,
                        parse_mode: 'HTML'
                    });
                }
                catch (error) {
                    console.error('Error sending video:', error);
                    return ctx.replyWithHTML('❌ <b>Kechirasiz, faylni yuborishda xatolik yuz berdi.</b>');
                }
            }
            else {
                return ctx.replyWithHTML('😔 <b>Afsus, ushbu kod bilan kino topilmadi.</b>\n<i>Kodni to\'g\'ri yozganingizga ishonch hosil qiling!</i>');
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