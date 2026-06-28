import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, clientsTable, interactionsTable } from "@workspace/db";
import {
  GenerateEmailBody,
  DraftObjectionBody,
  SuggestStepsBody,
  GenerateSummaryBody,
} from "@workspace/api-zod";
import {
  generateFollowUpEmail,
  draftObjectionResponse,
  generateInteractionSummary,
  suggestNextSteps,
} from "../lib/claude";

const router = Router();

function safeParseMemory(raw: string | null) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

router.post("/tasks/generate-email", async (req, res): Promise<void> => {
  const parsed = GenerateEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, parsed.data.client_id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const result = await generateFollowUpEmail({
    ...client,
    deal_stage: client.dealStage,
    memory: safeParseMemory(client.memory),
  });

  res.json(result);
});

router.post("/tasks/draft-objection", async (req, res): Promise<void> => {
  const parsed = DraftObjectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, parsed.data.client_id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const result = await draftObjectionResponse(
    {
      ...client,
      deal_stage: client.dealStage,
      memory: safeParseMemory(client.memory),
    },
    parsed.data.objection
  );

  res.json(result);
});

router.post("/tasks/suggest-steps", async (req, res): Promise<void> => {
  const parsed = SuggestStepsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, parsed.data.client_id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const result = await suggestNextSteps({
    ...client,
    deal_stage: client.dealStage,
    memory: safeParseMemory(client.memory),
  });

  res.json(result);
});

router.post("/tasks/generate-summary", async (req, res): Promise<void> => {
  const parsed = GenerateSummaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, parsed.data.client_id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const recentInteractions = await db
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.clientId, client.id))
    .orderBy(desc(interactionsTable.timestamp))
    .limit(5);

  const result = await generateInteractionSummary(
    {
      ...client,
      deal_stage: client.dealStage,
      memory: safeParseMemory(client.memory),
    },
    recentInteractions.map((i) => ({ timestamp: i.timestamp, content: i.content }))
  );

  res.json(result);
});

export default router;
