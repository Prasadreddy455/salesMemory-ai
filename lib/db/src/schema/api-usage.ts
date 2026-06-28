import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apiUsageTable = pgTable("api_usage", {
  id: text("id").primaryKey(),
  taskType: text("task_type").notNull(),
  modelUsed: text("model_used").notNull(),
  cost: real("cost").notNull(),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApiUsageSchema = createInsertSchema(apiUsageTable).omit({ createdAt: true });
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type ApiUsage = typeof apiUsageTable.$inferSelect;
