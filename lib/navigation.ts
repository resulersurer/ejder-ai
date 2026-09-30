export const sections = {
  overview: {
    label: "Genel bakış",
    href: "/",
    title: "Her talep, yeni bir yolculuk.",
    description:
      "Lead'lerinizi takip edin, görüşmeleri yönetin ve rezervasyona dönüştürün.",
  },
  leads: {
    label: "Lead merkezi",
    href: "/leads",
    title: "Lead merkezi",
    description:
      "Tüm tur talepleri, tüm müşteri bilgileri. Tek bir çalışma alanında.",
  },
  calls: {
    label: "Görüşmeler",
    href: "/calls",
    title: "Görüşmeler",
    description:
      "Görüşme sonuçlarını ve müşterilerinizin sonraki adımlarını takip edin.",
  },
  reservations: {
    label: "Rezervasyonlar",
    href: "/reservations",
    title: "Rezervasyon taslakları",
    description: "Görüşmeden rezervasyona hazır talepleri inceleyin.",
  },
  integrations: {
    label: "Entegrasyonlar",
    href: "/integrations",
    title: "Birbirine bağlı bir operasyon.",
    description:
      "TurTakip'ten gelen talep, Ejder AI görüşmesi, yeni bir rezervasyon.",
  },
} as const;

export type Section = keyof typeof sections;
