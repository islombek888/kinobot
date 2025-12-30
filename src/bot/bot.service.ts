import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotService {
    constructor(private prisma: PrismaService) { }

    async findMovieByCode(code: string) {
        return this.prisma.movie.findUnique({
            where: { code },
        });
    }

    async addMovie(code: string, title: string, fileId: string) {
        return this.prisma.movie.upsert({
            where: { code },
            update: { title, fileId },
            create: { code, title, fileId },
        });
    }

    async isAdmin(tgId: string) {
        const user = await this.prisma.user.findUnique({
            where: { tgId: tgId.toString() },
        });
        return user?.isAdmin || tgId.toString() === process.env.ADMIN_ID;
    }

    async setAdmin(tgId: string, isAdmin: boolean) {
        try {
            return await this.prisma.user.upsert({
                where: { tgId: tgId.toString() },
                update: { isAdmin },
                create: { tgId: tgId.toString(), isAdmin },
            });
        } catch (error) {
            console.error(`[BotService] Error setting admin for ${tgId}:`, error);
            throw error;
        }
    }

    async getStats() {
        const moviesCount = await this.prisma.movie.count();
        const usersCount = await this.prisma.user.count();
        return { moviesCount, usersCount };
    }
}
