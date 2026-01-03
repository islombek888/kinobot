import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotService {
    constructor(private prisma: PrismaService) { }

    async findMovieByCode(code: string) {
        try {
            return await this.prisma.movie.findUnique({
                where: { code },
            });
        } catch (error: any) {
            console.error(`[BotService] findMovieByCode Error (Code: ${code}):`, error.message);
            return null;
        }
    }

    async saveUser(tgId: string) {
        try {
            return await this.prisma.user.upsert({
                where: { tgId: tgId.toString() },
                update: {},
                create: { tgId: tgId.toString() },
            });
        } catch (error: any) {
            console.error(`[BotService] saveUser Error (ID: ${tgId}):`, error.message);
            return null;
        }
    }

    async addMovie(code: string, title: string, fileId: string) {
        try {
            return await this.prisma.movie.upsert({
                where: { code },
                update: { title, fileId },
                create: { code, title, fileId },
            });
        } catch (error: any) {
            console.error(`[BotService] addMovie Error (Code: ${code}):`, error.message);
            throw error;
        }
    }

    async isAdmin(tgId: string) {
        try {
            const idStr = tgId.toString();
            if (idStr === process.env.ADMIN_ID) return true;

            const user = await this.prisma.user.findUnique({
                where: { tgId: idStr },
            });
            return !!user?.isAdmin;
        } catch (error: any) {
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
        } catch (error: any) {
            console.error(`[BotService] getStats Error:`, error.message);
            return { moviesCount: 0, usersCount: 0 };
        }
    }
}
