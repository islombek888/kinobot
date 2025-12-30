"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BotService = class BotService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMovieByCode(code) {
        return this.prisma.movie.findUnique({
            where: { code },
        });
    }
    async addMovie(code, title, fileId) {
        return this.prisma.movie.upsert({
            where: { code },
            update: { title, fileId },
            create: { code, title, fileId },
        });
    }
    async isAdmin(tgId) {
        const user = await this.prisma.user.findUnique({
            where: { tgId: tgId.toString() },
        });
        return user?.isAdmin || tgId.toString() === process.env.ADMIN_ID;
    }
    async setAdmin(tgId, isAdmin) {
        try {
            return await this.prisma.user.upsert({
                where: { tgId: tgId.toString() },
                update: { isAdmin },
                create: { tgId: tgId.toString(), isAdmin },
            });
        }
        catch (error) {
            console.error(`[BotService] Error setting admin for ${tgId}:`, error);
            throw error;
        }
    }
    async getStats() {
        const moviesCount = await this.prisma.movie.count();
        const usersCount = await this.prisma.user.count();
        return { moviesCount, usersCount };
    }
};
exports.BotService = BotService;
exports.BotService = BotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BotService);
//# sourceMappingURL=bot.service.js.map