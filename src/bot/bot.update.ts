import { Update, Start, On, Message, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    constructor(private readonly botService: BotService) { }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        // Welcoming sticker (common friendly bird sticker)
        try {
            await ctx.sendSticker('CAACAgIAAxkBAAEL6_FmB_yP8_8_8_8_8_8_8_8_8_8_8');
        } catch (e) { }

        await ctx.replyWithHTML(
            '<b>🌟 Assalomu alaykum! Kino olamiga xush kelibsiz!</b>\n\n' +
            'Bu bot orqali siz istagan kinongizni soniyalar ichida topishingiz mumkin.\n\n' +
            '🔍 <b>Kino topish uchun:</b>\n' +
            'Shunchaki kino kodini yuboring (Masalan: <code>44</code>)\n\n' +
            '🎭 <b>Sizga maroqli hordiq tilaymiz!</b>',
        );
    }

    @On('message')
    async onMessage(@Ctx() ctx: Context) {
        const message = ctx.message as any;
        const text = message?.text;
        const userId = ctx.from?.id.toString();

        if (!userId || !text) return;

        // Handle Admin Command: /add [code] [title] (replying to a video/file)
        if (text.startsWith('/add')) {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin) return;

            const parts = text.split(' ');
            if (parts.length < 3) {
                return ctx.replyWithHTML(
                    '⚠️ <b>Xato format!</b>\n\n' +
                    'To\'g\'ri foydalanish: <code>/add [kod] [nomi]</code>\n' +
                    '<i>(Videoga javob bergan holda yozing)</i>'
                );
            }

            const code = parts[1];
            const title = parts.slice(2).join(' ');

            const replyMessage = message.reply_to_message;
            if (!replyMessage) {
                return ctx.replyWithHTML('📌 <b>Iltimos, videoga Reply (Javob) qilib yozing!</b>');
            }

            const fileId =
                replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;

            if (!fileId) {
                return ctx.replyWithHTML('🚫 <b>Hech qanday video yoki fayl topilmadi!</b>');
            }

            try {
                await this.botService.addMovie(code, title, fileId);
                // Success sticker
                try { await ctx.sendSticker('CAACAgIAAxkBAAEL7ABmCAAB_8_8_8_8_8_8_8_8_8_8'); } catch (e) { }

                return ctx.replyWithHTML(
                    '✅ <b>Kino muvaffaqiyatli qo\'shildi!</b>\n\n' +
                    `🎬 <b>Nomi:</b> ${title}\n` +
                    `🆔 <b>Kod:</b> <code>${code}</code>\n\n` +
                    '🚀 <i>Endi bu kodni yozgan har bir kishi kinoni ko\'ra oladi!</i>'
                );
            } catch (error) {
                console.error('Error adding movie:', error);
                return ctx.replyWithHTML('❌ <b>Bazaga saqlashda texnik xatolik yuz berdi!</b>');
            }
        }

        if (text === '/stats') {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin) return;

            const { moviesCount, usersCount } = await this.botService.getStats();
            return ctx.replyWithHTML(
                '📊 <b>Bot Statistikasi:</b>\n\n' +
                `🎬 <b>Kinolar soni:</b> ${moviesCount}\n` +
                `👤 <b>Foydalanuvchilar:</b> ${usersCount}`
            );
        }

        // Handle Search
        if (/^\d+$/.test(text)) {
            const movie = await this.botService.findMovieByCode(text);
            if (movie) {
                try {
                    return await ctx.sendVideo(movie.fileId, {
                        caption: `🎬 <b>${movie.title}</b>\n\n🔑 <b>Kod:</b> <code>${movie.code}</code>\n\n🍿 <i>Yoqimli tomosha!</i>`,
                        parse_mode: 'HTML'
                    });
                } catch (error) {
                    console.error('Error sending video:', error);
                    return ctx.replyWithHTML('❌ <b>Kechirasiz, faylni yuborishda xatolik yuz berdi.</b>');
                }
            } else {
                return ctx.replyWithHTML('😔 <b>Afsus, ushbu kod bilan kino topilmadi.</b>\n<i>Kodni to\'g\'ri yozganingizga ishonch hosil qiling!</i>');
            }
        }
    }
}
