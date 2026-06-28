import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, interactionsTable } from "@workspace/db";
import { CreateInteractionBody, GetClientInteractionsParams } from "@workspace/api-zod";

const router = Router();

router.post("/interactions", async (req, res): Promise<void> => {
  const parsed = CreateInteractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { client_id, type, content, generated_by_model, cost } = parsed.data;

  const [interaction] = await db
    .insert(interactionsTable)
    .values({
      id: uuidv4(),
      clientId: client_id,
      type,
      content,
      generatedByModel: generated_by_model ?? null,
      cost: cost ?? 0,
    })
    .returning();

  res.status(201).json({
    ...interaction,
    client_id: interaction.clientId,
    generated_by_model: interaction.generatedByModel,
  });
});

router.get("/interactions/client/:clientId", async (req, res): Promise<void> => {
  const params = GetClientInteractionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const interactions = await db
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.clientId, params.data.clientId))
    .orderBy(desc(interactionsTable.timestamp));

  res.json(
    interactions.map((i) => ({
      ...i,
      client_id: i.clientId,
      generated_by_model: i.generatedByModel,
    }))
  );
});

export default router;
