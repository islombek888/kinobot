import { Update, Start, On, Message, Ctx, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    private readonly REQUIRED_CHANNEL = '@xorazm_kino1';

    constructor(private readonly botService: BotService) {
        console.log('[BotUpdate] BotUpdate instance initialized');
    }

    private async checkSubscription(ctx: Context, userId: number): Promise<boolean> {
        try {
            console.log(`[BotUpdate] Checking subscription for user ${userId}...`);
            // Admin bypass
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
        } catch (error) {
            console.error(`[BotUpdate] Error checking subscription for ${userId}:`, error.message);
            // If we can't check, assume not subscribed to be safe
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
        return;
    }

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        const userId = ctx.from?.id;
        console.log(`[BotUpdate] /start command received from ${userId} (${ctx.from?.username || 'no username'})`);
        if (!userId) {
            console.log('[BotUpdate] userId is missing, skipping');
            return;
        }

        try {
            // Save user to DB
            console.log(`[BotUpdate] Saving user ${userId} to DB...`);
            await this.botService.saveUser(userId.toString()).catch(err => {
                console.error(`[BotUpdate] Failed to save user ${userId}:`, err.message);
            });
            console.log(`[BotUpdate] User ${userId} checked/saved`);


            // One-time check for subscription ONLY on /start
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
        } catch (error) {
            console.error(`[BotUpdate] Fatal error in onStart for ${userId}:`, error);
        }
        return;
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

        return;
    }


    @Action('check_sub')
    async onCheckSub(@Ctx() ctx: Context): Promise<void> {
        const userId = ctx.from?.id;
        if (!userId) return;

        // User clicked the button, we answer and delete message, then send welcome message regardless of actual subscription status
        // as requested by the user ("user bosa ham bosmasaham tekshiirshni bosa bo't o'tkazib yubosin")
        await ctx.answerCbQuery('✅ Rahmat! Endi botdan foydalanishingiz mumkin.').catch(() => { });
        await ctx.deleteMessage().catch(() => { });
        await this.sendWelcomeMessage(ctx);
        return;
    }

    @On('message')
    async onMessage(@Ctx() ctx: Context): Promise<void> {
        const message = ctx.message as any;
        const text = message?.text;
        const userId = ctx.from?.id;

        console.log(`[BotUpdate] Incoming message from ${userId}: "${text || '[non-text]'}"`);

        if (!userId || !text) return;

        const trimmedText = text.trim();
        const isAdmin = await this.botService.isAdmin(userId.toString());
        console.log(`[BotUpdate] User ${userId} isAdmin: ${isAdmin}`);

        if (isAdmin && trimmedText.startsWith('/add')) {
            console.log(`[BotUpdate] Admin ${userId} is adding a movie...`);
            const parts = trimmedText.split(/\s+/);
            if (parts.length < 3) {
                await ctx.replyWithHTML(
                    '⚠️ <b>Xato format!</b>\n\n' +
                    'To\'g\'ri foydalanish: <code>/add [kod] [nomi]</code>\n' +
                    '<i>(Videoga javob bergan holda yozing)</i>'
                );
                return;
            }

            const code = parts[1];
            const title = parts.slice(2).join(' ');

            const replyMessage = message.reply_to_message;
            if (!replyMessage) {
                await ctx.replyWithHTML('📌 <b>Iltimos, videoga Reply (Javob) qilib yozing!</b>');
                return;
            }

            const fileId =
                replyMessage.video?.file_id ||
                replyMessage.document?.file_id ||
                replyMessage.animation?.file_id;

            if (!fileId) {
                await ctx.replyWithHTML('🚫 <b>Hech qanday video yoki fayl topilmadi!</b>');
                return;
            }

            try {
                await this.botService.addMovie(code, title, fileId);
                try { await ctx.sendSticker('CAACAgIAAxkBAAEL7ABmCAAB_8_8_8_8_8_8_8_8_8_8'); } catch (e) { }

                await ctx.replyWithHTML(
                    '✅ <b>Kino muvaffaqiyatli qo\'shildi!</b>\n\n' +
                    `🎬 <b>Nomi:</b> ${title}\n` +
                    `🆔 <b>Kod:</b> <code>${code}</code>\n\n` +
                    '🚀 <i>Endi bu kodni yozgan har bir kishi kinoni ko\'ra oladi!</i>'
                );
                console.log(`[BotUpdate] Movie ${code} added by admin ${userId}`);
                return;
            } catch (error) {
                console.error('[BotUpdate] Error adding movie:', error);
                await ctx.replyWithHTML('❌ <b>Bazaga saqlashda texnik xatolik yuz berdi!</b>');
                return;
            }
        }

        if (trimmedText === '/stats' && isAdmin) {
            const { moviesCount, usersCount } = await this.botService.getStats();
            await ctx.replyWithHTML(
                '📊 <b>Bot Statistikasi:</b>\n\n' +
                `🎬 <b>Kinolar soni:</b> ${moviesCount}\n` +
                `👤 <b>Foydalanuvchilar:</b> ${usersCount}`
            );
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
                } catch (error) {
                    console.error('Error sending video:', error);
                    await ctx.replyWithHTML('❌ <b>Kechirasiz, faylni yuborishda xatolik yuz berdi.</b>');
                }
            } else {
                console.log(`[BotUpdate] Movie not found for code: ${trimmedText}`);
                await ctx.replyWithHTML('😔 <b>Afsus, ushbu kod bilan kino topilmadi.</b>\n<i>Kodni to\'g\'ri yozganingizga ishonch hosil qiling!</i>');
            }
        }
        return;
    }
}
