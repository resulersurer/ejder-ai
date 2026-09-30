import type { Lead, WorkspaceState } from "./domain";

const rows: [string, string, string, Lead["status"], number, number, string][] =
  [
    [
      "Elif Yılmaz",
      "İstanbul",
      "Büyük Balkan Turu",
      "NEW",
      2,
      0,
      "Eşiyle seyahat etmek istiyor. Kasım ayındaki kalkışları soruyor.",
    ],
    [
      "Mert Demir",
      "Ankara",
      "Klasik İtalya Turu",
      "QUEUED",
      2,
      1,
      "Çocuk için fiyat bilgisi ve otel detayları istiyor.",
    ],
    [
      "Zeynep Kaya",
      "İzmir",
      "Japonya & Sakura",
      "QUALIFIED",
      2,
      0,
      "Sakura döneminde seyahat etmek istiyor. Pasaportları hazır.",
    ],
    [
      "Emre Aydın",
      "Bursa",
      "Kapadokya Turu",
      "FOLLOW_UP",
      2,
      0,
      "Programı inceleyip tekrar görüşmek istiyor.",
    ],
    [
      "Selin Arslan",
      "İstanbul",
      "Büyük Balkan Turu",
      "NEW",
      1,
      0,
      "Tek kişilik oda seçenekleri hakkında bilgi bekliyor.",
    ],
    [
      "Can Öztürk",
      "Antalya",
      "Klasik İtalya Turu",
      "UNREACHABLE",
      2,
      0,
      "Hafta sonu kalkışlarını tercih ediyor.",
    ],
    [
      "Deniz Şahin",
      "Eskişehir",
      "Kapadokya Turu",
      "NEW",
      3,
      1,
      "Ailesiyle kısa bir tatil planlıyor.",
    ],
    [
      "Ece Aksoy",
      "İstanbul",
      "Japonya & Sakura",
      "NOT_INTERESTED",
      1,
      0,
      "Bu sezon için seyahat planını erteledi.",
    ],
  ];

export function createDemoState(): WorkspaceState {
  const leads: Lead[] = rows.map(
    (
      [fullName, city, tourName, status, adultCount, childCount, notes],
      index,
    ) => ({
      id: `demo-lead-${index + 1}`,
      code: `DEMO-${String(index + 1).padStart(3, "0")}`,
      fullName,
      city,
      tourName,
      status,
      adultCount,
      childCount,
      notes,
      phone: `0500000000${index}`,
      email: `demo${index + 1}@example.com`,
      source: "TurTakip formu",
      createdAt: `2026-09-30T${String(9 - index).padStart(2, "0")}:15:00.000Z`,
      isDemo: true,
    }),
  );
  return {
    version: 1,
    leads,
    reservations: [],
    calls: [
      {
        id: "demo-call-1",
        leadId: "demo-lead-3",
        outcome: "QUALIFIED",
        summary:
          "Örnek görüşme: Mart kalkışı için 2 kişilik rezervasyon talep edildi. Kalkış ve yolcu bilgileri taslakta tamamlanacak.",
        createdAt: "2026-09-30T09:30:00.000Z",
        isDemo: true,
      },
      {
        id: "demo-call-2",
        leadId: "demo-lead-4",
        outcome: "FOLLOW_UP",
        summary:
          "Örnek görüşme: Tur programını incelemek istiyor. Tekrar görüşme yapılacak.",
        createdAt: "2026-09-30T08:30:00.000Z",
        isDemo: true,
      },
      {
        id: "demo-call-3",
        leadId: "demo-lead-6",
        outcome: "UNREACHABLE",
        summary:
          "Örnek sonuç: Müşteriye ulaşılamadı. Yeniden sıraya alınabilir.",
        createdAt: "2026-09-30T07:30:00.000Z",
        isDemo: true,
      },
      {
        id: "demo-call-4",
        leadId: "demo-lead-8",
        outcome: "NOT_INTERESTED",
        summary:
          "Örnek görüşme: Müşteri seyahat planını ertelediğini belirtti.",
        createdAt: "2026-09-30T06:30:00.000Z",
        isDemo: true,
      },
    ],
  };
}
