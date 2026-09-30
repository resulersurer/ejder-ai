import "server-only";
import { z } from "zod";
import { getDatabase } from "./database/client";
import {
  agentOptions,
  type AgentKey,
  type TourAiConfiguration,
} from "./tour-ai-shared";

export const tourAiInputSchema = z.object({
  tourId: z.string().min(1).max(120),
  tourName: z.string().trim().min(2).max(200),
  tourSlug: z.string().min(1).max(200),
  phoneNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .refine(
      (value) => /^\+[1-9]\d{7,14}$/.test(value),
      "Numarayı ülke koduyla girin. Örnek: +908501234567",
    ),
  agentKey: z.enum(["SALES", "INFORMATION", "FOLLOW_UP"]),
  instructions: z.string().trim().max(4000),
  enabled: z.boolean(),
});
export type TourAiInput = z.infer<typeof tourAiInputSchema>;

export async function getTourAiConfigurations(): Promise<
  TourAiConfiguration[]
> {
  const sql = getDatabase();
  const rows =
    (await sql`SELECT id, turtakip_tour_id, tour_name, tour_slug, phone_number, ai_agent_key, ai_display_name, instructions, enabled, updated_at FROM ejder_ai.tour_ai_configurations ORDER BY updated_at DESC`) as Record<
      string,
      unknown
    >[];
  return rows.map((row) => ({
    id: String(row.id),
    tourId: String(row.turtakip_tour_id),
    tourName: String(row.tour_name),
    tourSlug: String(row.tour_slug),
    phoneNumber: String(row.phone_number),
    agentKey: row.ai_agent_key as AgentKey,
    aiDisplayName: String(row.ai_display_name),
    instructions: String(row.instructions),
    enabled: Boolean(row.enabled),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export async function saveTourAiConfiguration(input: TourAiInput) {
  const data = tourAiInputSchema.parse(input);
  const agent = agentOptions.find((item) => item.key === data.agentKey);
  if (!agent) throw new Error("AI danışmanı bulunamadı.");
  const sql = getDatabase();
  await sql`INSERT INTO ejder_ai.tour_ai_configurations (turtakip_tour_id, tour_name, tour_slug, phone_number, ai_agent_key, ai_display_name, instructions, enabled)
    VALUES (${data.tourId}, ${data.tourName}, ${data.tourSlug}, ${data.phoneNumber}, ${data.agentKey}, ${agent.name}, ${data.instructions}, ${data.enabled})
    ON CONFLICT (turtakip_tour_id) DO UPDATE SET tour_name = EXCLUDED.tour_name, tour_slug = EXCLUDED.tour_slug, phone_number = EXCLUDED.phone_number,
      ai_agent_key = EXCLUDED.ai_agent_key, ai_display_name = EXCLUDED.ai_display_name, instructions = EXCLUDED.instructions, enabled = EXCLUDED.enabled, updated_at = now()`;
}
