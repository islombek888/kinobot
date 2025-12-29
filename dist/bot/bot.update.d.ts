import { Context } from 'telegraf';
import { BotService } from './bot.service';
export declare class BotUpdate {
    private readonly botService;
    constructor(botService: BotService);
    onStart(ctx: Context): Promise<void>;
    onMessage(text: string, ctx: Context): Promise<import("@telegraf/types").Message.TextMessage | import("@telegraf/types").Message.VideoMessage | undefined>;
}
