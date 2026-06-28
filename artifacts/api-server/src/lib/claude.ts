import Anthropic from "@anthropic-ai/sdk";
import { db, apiUsageTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HAIKU_MODEL = "claude-haiku-4-5";
const SONNET_MODEL = "claude-sonnet-4-6";

const HAIKU_PRICE_INPUT = 0.0008;
const HAIKU_PRICE_OUTPUT = 0.004;
const SONNET_PRICE_INPUT = 0.003;
const SONNET_PRICE_OUTPUT = 0.015;

type TaskType = "email_sent" | "follow_ups" | "summaries" | "objection_handling" | "strategic_advice";

export function routeTask(taskType: TaskType): { model: string; maxTokens: number } {
  const haikuTasks: TaskType[] = ["email_sent", "follow_ups", "summaries"];
  if (haikuTasks.includes(taskType)) {
    return { model: HAIKU_MODEL, maxTokens: 8192 };
  }
  return { model: SONNET_MODEL, maxTokens: 8192 };
}

function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  if (model === HAIKU_MODEL) {
    return (inputTokens * HAIKU_PRICE_INPUT + outputTokens * HAIKU_PRICE_OUTPUT) / 1000;
  }
  return (inputTokens * SONNET_PRICE_INPUT + outputTokens * SONNET_PRICE_OUTPUT) / 1000;
}

async function logUsage(taskType: string, model: string, cost: number, tokensUsed: number) {
  try {
    await db.insert(apiUsageTable).values({
      id: uuidv4(),
      taskType,
      modelUsed: model,
      cost,
      tokensUsed,
    });
  } catch (err) {
    logger.error({ err }, "Failed to log API usage");
  }
}

export interface AIResult {
  content: string;
  model: string;
  cost: string;
  tokens_used: number;
}

interface ClientContext {
  name: string;
  company?: string | null;
  industry?: string | null;
  budget?: string | null;
  timeline?: string | null;
  deal_stage: string;
  memory?: {
    decision_makers?: string[];
    objections?: string[];
    notes?: string | null;
  };
}

export async function generateFollowUpEmail(client: ClientContext): Promise<AIResult> {
  const { model, maxTokens } = routeTask("email_sent");

  const prompt = `You are a skilled B2B sales representative. Generate a concise, professional follow-up email based on this client context:

Client Name: ${client.name}
Company: ${client.company || "Unknown"}
Industry: ${client.industry || "Unknown"}
Deal Stage: ${client.deal_stage}
Previous Notes: ${client.memory?.notes || "No notes"}
Decision Makers: ${client.memory?.decision_makers?.join(", ") || "Unknown"}

Generate a 3-4 sentence follow-up email that feels personal and references specific context from the notes. Keep it under 150 words. Include a subject line.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0].type === "text" ? message.content[0].text : "";
  const cost = calculateCost(message.usage.input_tokens, message.usage.output_tokens, model);
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  await logUsage("email_sent", model, cost, tokensUsed);

  return { content, model, cost: cost.toFixed(4), tokens_used: tokensUsed };
}

export async function draftObjectionResponse(client: ClientContext, objection: string): Promise<AIResult> {
  const { model, maxTokens } = routeTask("objection_handling");

  const prompt = `You are a skilled B2B sales strategist. Draft a response to this sales objection:

Client: ${client.name}
Company: ${client.company || "Unknown"}
Industry: ${client.industry || "Unknown"}
Objection: "${objection}"
Context: ${client.memory?.notes || "None"}

Provide a 2-3 sentence response that addresses the objection directly, references relevant context, and moves toward closing. Be empathetic but confident.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0].type === "text" ? message.content[0].text : "";
  const cost = calculateCost(message.usage.input_tokens, message.usage.output_tokens, model);
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  await logUsage("objection_handling", model, cost, tokensUsed);

  return { content, model, cost: cost.toFixed(4), tokens_used: tokensUsed };
}

export async function generateInteractionSummary(
  client: ClientContext,
  interactions: Array<{ timestamp: Date; content: string }>
): Promise<AIResult> {
  const { model, maxTokens } = routeTask("summaries");
  const interactionText = interactions
    .map((i) => `- ${new Date(i.timestamp).toLocaleDateString()}: ${i.content}`)
    .join("\n");

  const prompt = `Summarize this client's recent interaction history in 2-3 sentences. Focus on key takeaways and next steps:

Client: ${client.name}
Deal Stage: ${client.deal_stage}
Recent Interactions:
${interactionText || "No interactions yet"}

Provide a concise summary suitable for a sales manager's briefing.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0].type === "text" ? message.content[0].text : "";
  const cost = calculateCost(message.usage.input_tokens, message.usage.output_tokens, model);
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  await logUsage("summaries", model, cost, tokensUsed);

  return { content, model, cost: cost.toFixed(4), tokens_used: tokensUsed };
}

export async function suggestNextSteps(client: ClientContext): Promise<AIResult> {
  const { model, maxTokens } = routeTask("strategic_advice");

  const prompt = `You are a B2B sales strategy advisor. Suggest the 3 most impactful next steps for this deal:

Client: ${client.name}
Deal Stage: ${client.deal_stage}
Budget: ${client.budget || "Unknown"}
Timeline: ${client.timeline || "Unknown"}
Notes: ${client.memory?.notes || "None"}
Known Objections: ${client.memory?.objections?.join(", ") || "None"}

Provide exactly 3 bullet points with specific, actionable next steps. Keep each under 20 words.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0].type === "text" ? message.content[0].text : "";
  const cost = calculateCost(message.usage.input_tokens, message.usage.output_tokens, model);
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  await logUsage("strategic_advice", model, cost, tokensUsed);

  return { content, model, cost: cost.toFixed(4), tokens_used: tokensUsed };
}
