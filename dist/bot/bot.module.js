"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const config_1 = require("@nestjs/config");
const bot_update_1 = require("./bot.update");
const bot_service_1 = require("./bot.service");
let BotModule = class BotModule {
};
exports.BotModule = BotModule;
exports.BotModule = BotModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_telegraf_1.TelegrafModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const token = configService.get('BOT_TOKEN');
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
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [bot_update_1.BotUpdate, bot_service_1.BotService],
    })
], BotModule);
//# sourceMappingURL=bot.module.js.map