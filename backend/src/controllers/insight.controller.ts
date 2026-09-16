import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class InsightController {
    static async getInsights(req: Request, res: Response) {
        try {
            const session = (req as any).session;
           
            if (!session?.user?.id) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (session.user.role !== "admin") {
                return res.status(403).json({ error: "Forbidden - Admin access required" });
            }

            const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
            const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10)));
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
            
            // Allow offset override or calculate from page
            const skip = offset !== undefined ? Math.max(0, offset) : (page - 1) * limit;

            const [insights, total] = await Promise.all([
                prisma.insight.findMany({
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: limit,
                    skip: skip,
                }),
                prisma.insight.count(),
            ]);

            const totalPages = Math.max(1, Math.ceil(total / limit));
            const currentPage = offset !== undefined ? Math.floor(skip / limit) + 1 : page;

            return res.json({
                insights,
                pagination: {
                    total,
                    page: currentPage,
                    limit,
                    totalPages,
                    offset: skip,
                    hasMore: skip + limit < total,
                    hasPrev: currentPage > 1,
                },
            });

        } catch (error) {
            console.error("Error fetching insights:", error);
            return res.status(500).json({ error: "Failed to fetch insights" });
        }
    }
}
