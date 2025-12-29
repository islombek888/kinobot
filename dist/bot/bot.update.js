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
        await ctx.reply('Assalomu alaykum! Kino botga xush kelibsiz.\n\nKino topish uchun uning kodini (raqamini) yuboring.\nMasalan: 4');
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
                return ctx.reply('Format: /add [kod] [nomi]\n\nMasalan: /add 123 Avatar (videoga reply qilib yozing)');
            }
            const code = parts[1];
            const title = parts.slice(2).join(' ');
            const replyMessage = message.reply_to_message;
            if (!replyMessage) {
                return ctx.reply('Iltimos, kino qo\'shmoqchi bo\'lgan videoga reply (javob berish) qilib /add buyrug\'ini yuboring.');
            }
            const fileId = replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;
            if (!fileId) {
                return ctx.reply('Siz reply qilgan xabarda video yoki fayl topilmadi.');
            }
            try {
                await this.botService.addMovie(code, title, fileId);
                return ctx.reply(`✅ Kino muvaffaqiyatli qo'shildi!\n\n🔹 Kod: ${code}\n🎬 Nomi: ${title}`);
            }
            catch (error) {
                console.error('Error adding movie:', error);
                return ctx.reply('❌ Kinoni qo\'shishda xatolik yuz berdi.');
            }
        }
        if (text === '/stats') {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin)
                return;
            const { moviesCount, usersCount } = await this.botService.getStats();
            return ctx.reply(`Bot statistikasi:\n\nKinolar soni: ${moviesCount}\nFoydalanuvchilar soni: ${usersCount}`);
        }
        if (/^\d+$/.test(text)) {
            const movie = await this.botService.findMovieByCode(text);
            if (movie) {
                try {
                    return await ctx.sendVideo(movie.fileId, {
                        caption: `🎬 ${movie.title}\n\n🆔 Kod: ${movie.code}`
                    });
                }
                catch (error) {
                    console.error('Error sending video:', error);
                    return ctx.reply('Faylni yuborishda xatolik yuz berdi. Balki fayl ID eskidir?');
                }
            }
            else {
                return ctx.reply('Afsus, ushbu kod bilan kino topilmadi.');
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