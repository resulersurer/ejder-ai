import "server-only";
import { z } from "zod";

const responseSchema = z.object({
  generatedAt: z.iso.datetime(),
  tours: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      slug: z.string().min(1),
      departures: z.array(
        z.object({
          id: z.string().min(1),
          startDate: z.iso.datetime(),
          endDate: z.iso.datetime().nullable(),
          label: z.string().nullable(),
        }),
      ),
    }),
  ),
});

export type TurTakipTour = z.infer<typeof responseSchema>["tours"][number];
export class TurTakipConfigurationError extends Error {}

function getConfiguration() {
  const baseUrl = (
    process.env.TURTAKIP_API_URL?.trim() || "https://turtakipv2.vercel.app"
  ).replace(/\/$/, "");
  const key = process.env.TURTAKIP_INTEGRATION_KEY?.trim();
  if (!baseUrl || !key)
    throw new TurTakipConfigurationError("TurTakip bağlantı ayarları eksik.");
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:")
    throw new TurTakipConfigurationError("TurTakip adresi HTTPS olmalı.");
  return { baseUrl, key };
}

export async function getTurTakipTours(): Promise<TurTakipTour[]> {
  const { baseUrl, key } = getConfiguration();
  const response = await fetch(`${baseUrl}/api/integrations/lead-data`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    throw new Error(
      `TurTakip tur servisi ${response.status} durumuyla yanıt verdi.`,
    );
  const parsed = responseSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error("TurTakip tur verisi beklenen yapıda değil.");
  return parsed.data.tours;
}
