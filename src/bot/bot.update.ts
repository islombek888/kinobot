import { Update, Start, On, Message, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    constructor(private readonly botService: BotService) { }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        await ctx.reply(
            'Assalomu alaykum! Kino botga xush kelibsiz.\n\nKino topish uchun uning kodini (raqamini) yuboring.\nMasalan: 4',
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
                return ctx.reply('Format: /add [kod] [nomi]\n\nMasalan: /add 123 Avatar (videoga reply qilib yozing)');
            }

            const code = parts[1];
            const title = parts.slice(2).join(' ');

            // Check if replying to a message with a file
            const replyMessage = message.reply_to_message;
            if (!replyMessage) {
                return ctx.reply('Iltimos, kino qo\'shmoqchi bo\'lgan videoga reply (javob berish) qilib /add buyrug\'ini yuboring.');
            }

            const fileId =
                replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;

            if (!fileId) {
                return ctx.reply('Siz reply qilgan xabarda video yoki fayl topilmadi.');
            }

            try {
                await this.botService.addMovie(code, title, fileId);
                return ctx.reply(`✅ Kino muvaffaqiyatli qo'shildi!\n\n🔹 Kod: ${code}\n🎬 Nomi: ${title}`);
            } catch (error) {
                console.error('Error adding movie:', error);
                return ctx.reply('❌ Kinoni qo\'shishda xatolik yuz berdi.');
            }
        }

        if (text === '/stats') {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin) return;

            const { moviesCount, usersCount } = await this.botService.getStats();
            return ctx.reply(`Bot statistikasi:\n\nKinolar soni: ${moviesCount}\nFoydalanuvchilar soni: ${usersCount}`);
        }

        // Handle Search
        if (/^\d+$/.test(text)) {
            const movie = await this.botService.findMovieByCode(text);
            if (movie) {
                try {
                    return await ctx.sendVideo(movie.fileId, {
                        caption: `🎬 ${movie.title}\n\n🆔 Kod: ${movie.code}`
                    });
                } catch (error) {
                    console.error('Error sending video:', error);
                    return ctx.reply('Faylni yuborishda xatolik yuz berdi. Balki fayl ID eskidir?');
                }
            } else {
                return ctx.reply('Afsus, ushbu kod bilan kino topilmadi.');
            }
        }
    }
}
