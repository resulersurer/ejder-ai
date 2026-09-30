"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/admin-access";
import { getTurTakipTours } from "@/lib/turtakip";
import { saveTourAiConfiguration, tourAiInputSchema } from "@/lib/tour-ai";

export type SaveTourAiState = { ok: boolean; message: string };

export async function saveTourAiAction(
  _: SaveTourAiState,
  formData: FormData,
): Promise<SaveTourAiState> {
  try {
    requireAdminAccess(String(formData.get("accessKey") ?? ""));
    const parsed = tourAiInputSchema.safeParse({
      tourId: formData.get("tourId"),
      tourName: formData.get("tourName"),
      tourSlug: formData.get("tourSlug"),
      phoneNumber: formData.get("phoneNumber"),
      agentKey: formData.get("agentKey"),
      instructions: formData.get("instructions"),
      enabled: formData.get("enabled") === "on",
    });
    if (!parsed.success)
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin.",
      };
    const tours = await getTurTakipTours();
    const liveTour = tours.find((tour) => tour.id === parsed.data.tourId);
    if (
      !liveTour ||
      liveTour.name !== parsed.data.tourName ||
      liveTour.slug !== parsed.data.tourSlug
    )
      return {
        ok: false,
        message: "TurTakip tur bilgisi değişmiş. Sayfayı yenileyin.",
      };
    await saveTourAiConfiguration(parsed.data);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ayar kaydedilemedi.",
    };
  }
  revalidatePath("/tour-ai");
  return { ok: true, message: "Tur, numara ve AI eşleştirmesi kaydedildi." };
}
