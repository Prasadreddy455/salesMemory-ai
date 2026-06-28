import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, clientsTable, interactionsTable, apiUsageTable } from "@workspace/db";
import {
  CreateClientBody,
  UpdateClientBody,
  GetClientParams,
  UpdateClientParams,
  DeleteClientParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/clients/pipeline/summary", async (req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable);

  const stages = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"];
  const byStage = stages.map((stage) => ({
    stage,
    count: clients.filter((c) => c.dealStage === stage).length,
  }));

  const wonThisMonth = clients.filter((c) => {
    if (c.dealStage !== "Won") return false;
    const now = new Date();
    const updated = new Date(c.updatedAt);
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
  }).length;

  const monthlyCostResult = await db
    .select({ total: sql<number>`COALESCE(SUM(cost), 0)` })
    .from(apiUsageTable)
    .where(sql`DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`);

  res.json({
    total_deals: clients.length,
    total_pipeline_value: null,
    by_stage: byStage,
    monthly_cost: monthlyCostResult[0]?.total ?? 0,
    won_this_month: wonThisMonth,
  });
});

router.get("/clients", async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable).orderBy(desc(clientsTable.updatedAt));
  res.json(
    clients.map((c) => ({
      ...c,
      deal_stage: c.dealStage,
      memory: safeParseMemory(c.memory),
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }))
  );
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, company, industry, budget, timeline, deal_stage } = parsed.data;
  const id = uuidv4();

  const [client] = await db
    .insert(clientsTable)
    .values({
      id,
      name,
      company: company ?? null,
      industry: industry ?? null,
      budget: budget ?? null,
      timeline: timeline ?? null,
      dealStage: deal_stage ?? "Discovery",
      memory: "{}",
    })
    .returning();

  res.status(201).json({
    ...client,
    deal_stage: client.dealStage,
    memory: safeParseMemory(client.memory),
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const interactions = await db
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.clientId, client.id))
    .orderBy(desc(interactionsTable.timestamp));

  res.json({
    ...client,
    deal_stage: client.dealStage,
    memory: safeParseMemory(client.memory),
    created_at: client.createdAt,
    updated_at: client.updatedAt,
    interactions: interactions.map((i) => ({
      ...i,
      client_id: i.clientId,
      generated_by_model: i.generatedByModel,
    })),
  });
});

router.put("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, company, industry, budget, timeline, deal_stage, memory } = parsed.data;

  const [client] = await db
    .update(clientsTable)
    .set({
      ...(name !== undefined && { name }),
      ...(company !== undefined && { company }),
      ...(industry !== undefined && { industry }),
      ...(budget !== undefined && { budget }),
      ...(timeline !== undefined && { timeline }),
      ...(deal_stage !== undefined && { dealStage: deal_stage }),
      ...(memory !== undefined && { memory: JSON.stringify(memory) }),
    })
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json({
    ...client,
    deal_stage: client.dealStage,
    memory: safeParseMemory(client.memory),
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  });
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(interactionsTable).where(eq(interactionsTable.clientId, params.data.id));
  await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id));

  res.json({ success: true });
});

function safeParseMemory(raw: string | null): object {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default router;
