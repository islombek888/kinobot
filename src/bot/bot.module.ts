import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                token: configService.get<string>('BOT_TOKEN')!,
                options: {
                    handlerTimeout: 10000,
                },
                launchOptions: {
                    
                    dropPendingUpdates: true,
                }
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [BotUpdate, BotService],
})
export class BotModule { }
