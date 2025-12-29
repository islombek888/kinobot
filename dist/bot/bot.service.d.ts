import { PrismaService } from '../prisma/prisma.service';
export declare class BotService {
    private prisma;
    constructor(prisma: PrismaService);
    findMovieByCode(code: string): Promise<{
        id: string;
        code: string;
        title: string;
        fileId: string;
        createdAt: Date;
    } | null>;
    addMovie(code: string, title: string, fileId: string): Promise<{
        id: string;
        code: string;
        title: string;
        fileId: string;
        createdAt: Date;
    }>;
    isAdmin(tgId: string): Promise<boolean>;
    setAdmin(tgId: string, isAdmin: boolean): Promise<{
        id: string;
        tgId: string;
        isAdmin: boolean;
    }>;
    getStats(): Promise<{
        moviesCount: number;
        usersCount: number;
    }>;
}
