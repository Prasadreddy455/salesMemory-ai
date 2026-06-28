import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interactionsTable = pgTable("interactions", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  generatedByModel: text("generated_by_model"),
  cost: real("cost").default(0),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInteractionSchema = createInsertSchema(interactionsTable).omit({ timestamp: true });
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactionsTable.$inferSelect;
