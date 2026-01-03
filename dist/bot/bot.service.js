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
        try {
            return await this.prisma.movie.findUnique({
                where: { code },
            });
        }
        catch (error) {
            console.error(`[BotService] findMovieByCode Error (Code: ${code}):`, error.message);
            return null;
        }
    }
    async saveUser(tgId) {
        try {
            return await this.prisma.user.upsert({
                where: { tgId: tgId.toString() },
                update: {},
                create: { tgId: tgId.toString() },
            });
        }
        catch (error) {
            console.error(`[BotService] saveUser Error (ID: ${tgId}):`, error.message);
            return null;
        }
    }
    async addMovie(code, title, fileId) {
        try {
            return await this.prisma.movie.upsert({
                where: { code },
                update: { title, fileId },
                create: { code, title, fileId },
            });
        }
        catch (error) {
            console.error(`[BotService] addMovie Error (Code: ${code}):`, error.message);
            throw error;
        }
    }
    async isAdmin(tgId) {
        try {
            const idStr = tgId.toString();
            if (idStr === process.env.ADMIN_ID)
                return true;
            const user = await this.prisma.user.findUnique({
                where: { tgId: idStr },
            });
            return !!user?.isAdmin;
        }
        catch (error) {
            console.error(`[BotService] isAdmin Check Error:`, error.message);
            return tgId.toString() === process.env.ADMIN_ID;
        }
    }
    async getStats() {
        try {
            const [moviesCount, usersCount] = await Promise.all([
                this.prisma.movie.count(),
                this.prisma.user.count()
            ]);
            return { moviesCount, usersCount };
        }
        catch (error) {
            console.error(`[BotService] getStats Error:`, error.message);
            return { moviesCount: 0, usersCount: 0 };
        }
    }
};
exports.BotService = BotService;
exports.BotService = BotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BotService);
//# sourceMappingURL=bot.service.js.map