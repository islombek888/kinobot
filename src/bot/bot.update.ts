import { Update, Start, On, Message, Ctx, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    private readonly REQUIRED_CHANNEL = '@xorazm_kino1';

    constructor(private readonly botService: BotService) { }

    private async checkSubscription(ctx: Context, userId: number): Promise<boolean> {
        try {
            const member = await ctx.telegram.getChatMember(this.REQUIRED_CHANNEL, userId);
            const allowedStates = ['creator', 'administrator', 'member'];
            return allowedStates.includes(member.status);
        } catch (error) {
            console.error(`[BotUpdate] Error checking subscription for ${userId}:`, error);
            return false;
        }
    }

    private async sendSubscriptionPrompt(ctx: Context) {
        return ctx.replyWithHTML(
            `<b>⚠️ Botdan foydalanish uchun kanalimizga a'zo bo'lishingiz kerak!</b>\n\n` +
            `Iltimos, pastdagi kanalga obuna bo'ling va <b>"✅ Obunani tekshirish"</b> tugmasini bosing.`,
            Markup.inlineKeyboard([
                [Markup.button.url('↗️ Kanalga a\'zo bo\'lish', `https://t.me/${this.REQUIRED_CHANNEL.replace('@', '')}`)],
                [Markup.button.callback('✅ Obunani tekshirish', 'check_sub')]
            ])
        );
    }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        const userId = ctx.from?.id;
        if (!userId) return;

        const isSubscribed = await this.checkSubscription(ctx, userId);
        if (!isSubscribed) {
            return this.sendSubscriptionPrompt(ctx);
        }

        try {
            await ctx.sendSticker('CAACAgIAAxkBAAEL6_FmB_yP8_8_8_8_8_8_8_8_8_8_8');
        } catch (e) { }

        await ctx.replyWithHTML(
            '<b>🌟 Assalomu alaykum! Kino olamiga xush kelibsiz!</b>\n\n' +
            'Bu bot orqali siz istagan kinongizni soniyalar ichida topishingiz mumkin.\n\n' +
            '🔍 <b>Kino topish uchun:</b>\n' +
            'Shunchaki kino kodini yuboring \n\n' +
            '🎭 <b>Sizga maroqli hordiq tilaymiz!</b>',
            Markup.inlineKeyboard([
                [Markup.button.callback('🛠 Botda muammo bor', 'bot_problem')]
            ])
        );
    }

    @Action('bot_problem')
    async onBotProblem(@Ctx() ctx: Context) {
        await ctx.replyWithHTML(
            '👨‍💻 <b>Admin:</b> @Annazarov511\n\n' +
            '<i>Botda kamchilik yoki qo\'shimcha qo\'shish kerak bo\'lsa yozing.</i>'
        );
        await ctx.answerCbQuery();
    }

    @Action('check_sub')
    async onCheckSub(@Ctx() ctx: Context) {
        const userId = ctx.from?.id;
        if (!userId) return;

        const isSubscribed = await this.checkSubscription(ctx, userId);
        if (isSubscribed) {
            await ctx.answerCbQuery('✅ Rahmat! Endi botdan foydalanishingiz mumkin.');
            await ctx.deleteMessage().catch(() => { });
            return this.onStart(ctx);
        } else {
            await ctx.answerCbQuery('❌ Siz hali obuna bo\'lmagansiz!', { show_alert: true });
        }
    }

    @On('message')
    async onMessage(@Ctx() ctx: Context) {
        const message = ctx.message as any;
        const text = message?.text;
        const userId = ctx.from?.id;
        if (!userId || !text) return;

        const isSubscribed = await this.checkSubscription(ctx, userId);
        if (!isSubscribed) {
            return this.sendSubscriptionPrompt(ctx);
        }

        const trimmedText = text.trim();
        console.log(`[BotUpdate] Received message from ${userId} (Username: ${ctx.from?.username}): "${text}"`);

        if (trimmedText.startsWith('/add')) {
            const isAdmin = await this.botService.isAdmin(userId.toString());
            if (!isAdmin) return;

            const parts = trimmedText.split(/\s+/);
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

        if (trimmedText === '/stats') {
            const isAdmin = await this.botService.isAdmin(userId.toString());
            if (!isAdmin) return;

            const { moviesCount, usersCount } = await this.botService.getStats();
            return ctx.replyWithHTML(
                '📊 <b>Bot Statistikasi:</b>\n\n' +
                `🎬 <b>Kinolar soni:</b> ${moviesCount}\n` +
                `👤 <b>Foydalanuvchilar:</b> ${usersCount}`
            );
        }


        if (/^\d+$/.test(trimmedText)) {
            console.log(`[BotUpdate] Searching for movie code: ${trimmedText}`);
            const movie = await this.botService.findMovieByCode(trimmedText);
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
                console.log(`[BotUpdate] Movie not found for code: ${trimmedText}`);
                return ctx.replyWithHTML('😔 <b>Afsus, ushbu kod bilan kino topilmadi.</b>\n<i>Kodni to\'g\'ri yozganingizga ishonch hosil qiling!</i>');
            }
        }
    }
}
