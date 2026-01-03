import { Update, Start, On, Message, Ctx, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    private readonly REQUIRED_CHANNEL = '@xorazm_kino1';

    constructor(private readonly botService: BotService) { }

    private async checkSubscription(ctx: Context, userId: number): Promise<boolean> {
        try {
            const isAdmin = await this.botService.isAdmin(userId.toString());
            console.log(`[BotUpdate] checkSubscription for ${userId}: isAdmin=${isAdmin}`);
            if (isAdmin) {
                console.log(`[BotUpdate] Bypassing sub check because user is ADMIN.`);
                return true;
            }

            console.log(`[BotUpdate] Requesting chat member status for ${userId} in ${this.REQUIRED_CHANNEL}...`);
            const member = await ctx.telegram.getChatMember(this.REQUIRED_CHANNEL, userId);
            console.log(`[BotUpdate] Member status: ${member.status}`);
            const allowedStates = ['creator', 'administrator', 'member', 'restricted'];
            const result = allowedStates.includes(member.status);
            console.log(`[BotUpdate] Subscription result: ${result}`);
            return result;
        } catch (error: any) {
            console.error(`[BotUpdate] Subscription check error for ${userId}: ${error.message}`);
            return false;
        }
    }

    private async sendSubscriptionPrompt(ctx: Context): Promise<void> {
        await ctx.replyWithHTML(
            `<b>⚠️ Botdan foydalanish uchun kanalimizga a'zo bo'lishingiz kerak!</b>\n\n` +
            `Iltimos, pastdagi kanalga obuna bo'ling va <b>"✅ Obunani tekshirish"</b> tugmasini bosing.`,
            Markup.inlineKeyboard([
                [Markup.button.url('↗️ Kanalga a\'zo bo\'lish', `https://t.me/${this.REQUIRED_CHANNEL.replace('@', '')}`)],
                [Markup.button.callback('✅ Obunani tekshirish', 'check_sub')]
            ])
        );
    }

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        const userId = ctx.from?.id;
        if (!userId) return;

        try {
            console.log(`[BotUpdate] Version 2.0 - /start from ${userId}`);
            await this.botService.saveUser(userId.toString());

            const isSubscribed = await this.checkSubscription(ctx, userId);
            if (!isSubscribed) {
                await this.sendSubscriptionPrompt(ctx);
                return;
            }

            await this.sendWelcomeMessage(ctx);
        } catch (error) {
            console.error(`[BotUpdate] onStart error:`, error);
        }
    }

    private async sendWelcomeMessage(ctx: Context): Promise<void> {
        try {
            await ctx.sendSticker('CAACAgIAAxkBAAENID1nbBfM_U1O_8_8_8_8_8_8_8_8_8');
        } catch (e) { }

        await ctx.replyWithHTML(
            '<b>🌟 Assalomu alaykum! Kino olamiga xush kelibsiz!</b>\n\n' +
            'Bu bot orqali siz istagan kinongizni soniyalar ichida topishingiz mumkin.\n\n' +
            '🔍 <b>Kino topish uchun:</b>\n' +
            'Shunchaki kino kodini yuboring 🔎\n\n' +
            '🎭 <b>Sizga maroqli hordiq tilaymiz!</b>'
        );
    }

    @Action('check_sub')
    async onCheckSub(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery('✅ Rahmat!').catch(() => { });
        await ctx.deleteMessage().catch(() => { });
        await this.sendWelcomeMessage(ctx);
    }

    @On('message')
    async onMessage(@Ctx() ctx: Context): Promise<void> {
        const message = ctx.message as any;
        const text = message?.text;
        const userId = ctx.from?.id;
        if (!userId || !text) return;

        const trimmedText = text.trim();
        const isAdmin = await this.botService.isAdmin(userId.toString());

        // Admin: Add Movie
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
            } catch (error) {
                await ctx.replyWithHTML('❌ Bazaga saqlashda xatolik!');
            }
            return;
        }

        // Admin: Stats
        if (trimmedText === '/stats' && isAdmin) {
            const { moviesCount, usersCount } = await this.botService.getStats();
            await ctx.replyWithHTML(`📊 <b>Statistika:</b>\n\n🎬 Kinolar: ${moviesCount}\n👤 Foydalanuvchilar: ${usersCount}`);
            return;
        }

        // User: Search by Code
        if (/^\d+$/.test(trimmedText)) {
            const movie = await this.botService.findMovieByCode(trimmedText);
            if (movie) {
                await ctx.sendVideo(movie.fileId, {
                    caption: `🎬 <b>${movie.title}</b>\n\n🔑 <b>Kod:</b> <code>${movie.code}</code>`,
                    parse_mode: 'HTML'
                }).catch(() => ctx.reply('❌ Videoni yuborishda xatolik!'));
            } else {
                await ctx.replyWithHTML('😔 <b>Kino topilmadi.</b>');
            }
        }
    }
}
