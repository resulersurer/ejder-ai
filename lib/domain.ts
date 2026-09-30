import { z } from "zod";

export const leadStatuses = [
  "NEW",
  "QUEUED",
  "QUALIFIED",
  "FOLLOW_UP",
  "UNREACHABLE",
  "NOT_INTERESTED",
  "DRAFT",
] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export const statusLabels: Record<LeadStatus, string> = {
  NEW: "Yeni lead",
  QUEUED: "Sırada",
  QUALIFIED: "Rezervasyona hazır",
  FOLLOW_UP: "Tekrar görüşülecek",
  UNREACHABLE: "Ulaşılamadı",
  NOT_INTERESTED: "İlgilenmiyor",
  DRAFT: "Taslak oluşturuldu",
};
export const outcomeLabels = {
  QUALIFIED: "Rezervasyon istiyor",
  FOLLOW_UP: "Tekrar görüşülecek",
  UNREACHABLE: "Ulaşılamadı",
  NOT_INTERESTED: "İlgilenmiyor",
} as const;
export type Outcome = keyof typeof outcomeLabels;

export const leadInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ad soyad en az 3 karakter olmalı.")
    .max(100),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine(
      (v) => /^(?:\+90|0)?5\d{9}$/.test(v),
      "Geçerli bir Türkiye cep telefonu girin.",
    ),
  email: z.union([z.literal(""), z.email("Geçerli bir e-posta girin.")]),
  city: z.string().trim().max(80),
  tourName: z.string().trim().min(2, "Tur tercihini girin.").max(160),
  adultCount: z.number().int().min(1).max(50),
  childCount: z.number().int().min(0).max(50),
  notes: z.string().trim().max(2000),
});
export type LeadInput = z.infer<typeof leadInputSchema>;

const leadSchema = leadInputSchema.extend({
  id: z.string(),
  code: z.string(),
  status: z.enum(leadStatuses),
  source: z.enum(["TurTakip formu", "Manuel kayıt"]),
  createdAt: z.iso.datetime(),
  isDemo: z.literal(true),
});
export type Lead = z.infer<typeof leadSchema>;

const callSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  outcome: z.enum(["QUALIFIED", "FOLLOW_UP", "UNREACHABLE", "NOT_INTERESTED"]),
  summary: z.string().min(5).max(2000),
  createdAt: z.iso.datetime(),
  isDemo: z.literal(true),
});
export type Call = z.infer<typeof callSchema>;

const reservationSchema = z.object({
  id: z.string(),
  code: z.string(),
  leadId: z.string(),
  callId: z.string(),
  departureId: z.string(),
  departureLabel: z.string(),
  passengers: z.array(z.string().trim().min(3)).min(1),
  createdAt: z.iso.datetime(),
  status: z.literal("LOCAL_DRAFT"),
  isDemo: z.literal(true),
});
export type Reservation = z.infer<typeof reservationSchema>;

export const workspaceSchema = z
  .object({
    version: z.literal(1),
    leads: z.array(leadSchema),
    calls: z.array(callSchema),
    reservations: z.array(reservationSchema),
  })
  .superRefine((state, ctx) => {
    const leadIds = new Set(state.leads.map((lead) => lead.id));
    const callIds = new Set(state.calls.map((call) => call.id));
    if (
      leadIds.size !== state.leads.length ||
      callIds.size !== state.calls.length ||
      new Set(state.reservations.map((r) => r.id)).size !==
        state.reservations.length ||
      new Set(state.reservations.map((r) => r.leadId)).size !==
        state.reservations.length
    ) {
      ctx.addIssue({ code: "custom", message: "Tekrarlanan kayıt kimliği." });
    }
    if (
      state.calls.some((call) => !leadIds.has(call.leadId)) ||
      state.reservations.some(
        (reservation) =>
          !leadIds.has(reservation.leadId) ||
          !state.calls.some(
            (call) =>
              call.id === reservation.callId &&
              call.leadId === reservation.leadId &&
              call.outcome === "QUALIFIED",
          ),
      )
    ) {
      ctx.addIssue({ code: "custom", message: "Kayıt ilişkileri geçersiz." });
    }
  });
export type WorkspaceState = z.infer<typeof workspaceSchema>;

export const demoDepartures = [
  {
    id: "demo-balkan-1",
    tourName: "Büyük Balkan Turu",
    label: "Büyük Balkan Turu · 18 Kasım 2026",
  },
  {
    id: "demo-italya-1",
    tourName: "Klasik İtalya Turu",
    label: "Klasik İtalya Turu · 22 Kasım 2026",
  },
  {
    id: "demo-kapadokya-1",
    tourName: "Kapadokya Turu",
    label: "Kapadokya Turu · 14 Kasım 2026",
  },
  {
    id: "demo-japonya-1",
    tourName: "Japonya & Sakura",
    label: "Japonya & Sakura · 24 Mart 2027",
  },
] as const;

export type Action =
  | { type: "ADD_LEAD"; lead: Lead }
  | { type: "QUEUE"; leadId: string }
  | { type: "SAVE_NOTES"; leadId: string; notes: string }
  | { type: "RECORD_CALL"; call: Call }
  | { type: "CREATE_DRAFT"; reservation: Reservation };

export function transition(
  state: WorkspaceState,
  action: Action,
): WorkspaceState {
  if (action.type === "ADD_LEAD") {
    const lead = leadSchema.parse(action.lead);
    if (state.leads.some((item) => item.id === lead.id)) return state;
    return { ...state, leads: [lead, ...state.leads] };
  }
  const leadId =
    action.type === "RECORD_CALL"
      ? action.call.leadId
      : action.type === "CREATE_DRAFT"
        ? action.reservation.leadId
        : action.leadId;
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Lead bulunamadı.");
  const updateLead = (changes: Partial<Lead>) =>
    state.leads.map((item) =>
      item.id === lead.id ? { ...item, ...changes } : item,
    );
  if (action.type === "SAVE_NOTES") {
    return {
      ...state,
      leads: updateLead({
        notes: z.string().trim().max(2000).parse(action.notes),
      }),
    };
  }
  if (action.type === "QUEUE") {
    if (!["NEW", "FOLLOW_UP", "UNREACHABLE"].includes(lead.status))
      throw new Error("Bu lead sıraya alınamaz.");
    return { ...state, leads: updateLead({ status: "QUEUED" }) };
  }
  if (action.type === "RECORD_CALL") {
    const call = callSchema.parse(action.call);
    if (state.calls.some((item) => item.id === call.id)) return state;
    if (lead.status === "DRAFT")
      throw new Error(
        "Rezervasyon taslağı oluşturulmuş lead için sonuç değiştirilemez.",
      );
    return {
      ...state,
      calls: [call, ...state.calls],
      leads: updateLead({ status: call.outcome }),
    };
  }
  const reservation = reservationSchema.parse(action.reservation);
  if (state.reservations.some((item) => item.leadId === lead.id)) return state;
  if (lead.status !== "QUALIFIED")
    throw new Error("Önce rezervasyon isteyen bir görüşme sonucu kaydedin.");
  const latestCall = state.calls.find((item) => item.leadId === lead.id);
  if (
    !latestCall ||
    latestCall.id !== reservation.callId ||
    latestCall.outcome !== "QUALIFIED"
  )
    throw new Error("Son görüşme rezervasyon için uygun değil.");
  const departure = demoDepartures.find(
    (item) => item.id === reservation.departureId,
  );
  if (
    !departure ||
    departure.tourName !== lead.tourName ||
    departure.label !== reservation.departureLabel
  )
    throw new Error("Lead'in turuna uygun bir örnek kalkış seçin.");
  if (reservation.passengers.length !== lead.adultCount + lead.childCount)
    throw new Error("Her yolcu için ad soyad girin.");
  return {
    ...state,
    reservations: [reservation, ...state.reservations],
    leads: updateLead({ status: "DRAFT" }),
  };
}

export function filterLeads(
  leads: Lead[],
  query: string,
  status: string,
  source: string,
) {
  const needle = query.trim().toLocaleLowerCase("tr-TR");
  return leads.filter(
    (lead) =>
      (status === "ALL" || lead.status === status) &&
      (source === "ALL" || lead.source === source) &&
      `${lead.fullName} ${lead.phone} ${lead.tourName} ${lead.code}`
        .toLocaleLowerCase("tr-TR")
        .includes(needle),
  );
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
