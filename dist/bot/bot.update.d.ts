import { Context } from 'telegraf';
import { BotService } from './bot.service';
export declare class BotUpdate {
    private readonly botService;
    private readonly REQUIRED_CHANNEL;
    constructor(botService: BotService);
    private checkSubscription;
    private sendSubscriptionPrompt;
    onStart(ctx: Context): Promise<void>;
    private sendWelcomeMessage;
    onCheckSub(ctx: Context): Promise<void>;
    onMessage(ctx: Context): Promise<void>;
}
