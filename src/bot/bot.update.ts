import { Update, Start, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    constructor(private readonly botService: BotService) { }

    @Start()
    async onStart(ctx: Context) {
        await ctx.reply(
            'Assalomu alaykum! Kino botga xush kelibsiz.\n\nKino topish uchun uning kodini (raqamini) yuboring.\nMasalan: 4',
        );
    }

    @On('text')
    async onMessage(@Message('text') text: string, ctx: Context) {
        const userId = ctx.from?.id.toString();
        if (!userId) return;

        // Handle Admin Command: /add [code] [title] (replying to a video/file)
        if (text.startsWith('/add')) {
            const isAdmin = await this.botService.isAdmin(userId);
            if (!isAdmin) return;

            const parts = text.split(' ');
            if (parts.length < 3) {
                return ctx.reply('Format: /add [kod] [nomi] (va videoni reply qiling)');
            }

            const code = parts[1];
            const title = parts.slice(2).join(' ');

            // Check if replying to a message with a file
            const replyMessage = (ctx.message as any).reply_to_message;
            if (!replyMessage) {
                return ctx.reply('Iltimos, koda qo\'shmoqchi bo\'lgan videoga reply qilib /add buyrug\'ini yuboring.');
            }

            const fileId =
                replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;

            if (!fileId) {
                return ctx.reply('Reply qilingan xabarda video yoki fayl topilmadi.');
            }

            await this.botService.addMovie(code, title, fileId);
            return ctx.reply(`Kino muvaffaqiyatli qo'shildi!\nKod: ${code}\nNomi: ${title}`);
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
                await ctx.reply(`Kino topildi: ${movie.title}\nYuklanmoqda...`);
                return ctx.sendVideo(movie.fileId, { caption: `${movie.title}\n\nKod: ${movie.code}` });
            } else {
                return ctx.reply('Afsus, ushbu kod bilan kino topilmadi.');
            }
        }
    }
}
