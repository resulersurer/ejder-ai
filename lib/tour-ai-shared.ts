export const agentOptions = [
  {
    key: "SALES",
    name: "Satış danışmanı",
    description: "Tur hakkında bilgi verir ve rezervasyon niyetini toplar.",
  },
  {
    key: "INFORMATION",
    name: "Tur bilgi asistanı",
    description: "Program, tarih ve genel tur sorularını yanıtlar.",
  },
  {
    key: "FOLLOW_UP",
    name: "Takip danışmanı",
    description: "Daha önce bilgi alan misafiri yeniden arar.",
  },
] as const;

export type AgentKey = (typeof agentOptions)[number]["key"];

export type TourAiConfiguration = {
  id: string;
  tourId: string;
  tourName: string;
  tourSlug: string;
  phoneNumber: string;
  agentKey: AgentKey;
  aiDisplayName: string;
  instructions: string;
  enabled: boolean;
  updatedAt: string;
};
