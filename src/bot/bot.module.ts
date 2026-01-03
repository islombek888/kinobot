import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const token = configService.get<string>('BOT_TOKEN')!;
                console.log(`[BotModule] Loading bot with token ending in: ...${token.slice(-4)}`);
                return {
                    token: token,
                    options: {
                        handlerTimeout: 10000,
                    },
                    launchOptions: {
                        dropPendingUpdates: true,
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [BotUpdate, BotService],
})
export class BotModule { }
