import { Router } from "express";
import { desc, sql } from "drizzle-orm";
import { db, apiUsageTable } from "@workspace/db";

const router = Router();

router.get("/analytics/month-summary", async (_req, res): Promise<void> => {
  const [summary] = await db
    .select({
      total_cost: sql<number>`COALESCE(SUM(cost), 0)`,
      task_count: sql<number>`COUNT(*)`,
      avg_cost: sql<number>`COALESCE(AVG(cost), 0)`,
    })
    .from(apiUsageTable)
    .where(sql`DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`);

  const byModel = await db
    .select({
      model_used: apiUsageTable.modelUsed,
      count: sql<number>`COUNT(*)`,
      total_cost: sql<number>`SUM(cost)`,
    })
    .from(apiUsageTable)
    .where(sql`DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`)
    .groupBy(apiUsageTable.modelUsed);

  const byType = await db
    .select({
      task_type: apiUsageTable.taskType,
      count: sql<number>`COUNT(*)`,
      avg_cost: sql<number>`AVG(cost)`,
      total_cost: sql<number>`SUM(cost)`,
    })
    .from(apiUsageTable)
    .where(sql`DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`)
    .groupBy(apiUsageTable.taskType);

  res.json({
    total_cost: summary?.total_cost ?? 0,
    task_count: Number(summary?.task_count ?? 0),
    avg_cost: summary?.avg_cost ?? 0,
    by_model: byModel,
    by_type: byType,
  });
});

router.get("/analytics/daily-costs", async (_req, res): Promise<void> => {
  const costs = await db
    .select({
      date: sql<string>`DATE(created_at)::text`,
      daily_cost: sql<number>`SUM(cost)`,
    })
    .from(apiUsageTable)
    .where(sql`created_at >= NOW() - INTERVAL '30 days'`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at) ASC`);

  res.json(costs);
});

router.get("/analytics/usage-logs", async (_req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(apiUsageTable)
    .orderBy(desc(apiUsageTable.createdAt))
    .limit(100);

  res.json(
    logs.map((l) => ({
      id: l.id,
      task_type: l.taskType,
      model_used: l.modelUsed,
      cost: l.cost,
      tokens_used: l.tokensUsed,
      created_at: l.createdAt,
    }))
  );
});

export default router;
