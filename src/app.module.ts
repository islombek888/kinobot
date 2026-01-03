import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BotModule } from './bot/bot.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    
    BotModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
