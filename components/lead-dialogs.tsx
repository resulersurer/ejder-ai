"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Ticket,
  UsersRound,
} from "lucide-react";
import {
  dateLabel,
  demoDepartures,
  leadInputSchema,
  outcomeLabels,
  statusLabels,
  type Lead,
  type Outcome,
} from "@/lib/domain";
import { Dialog } from "./dialog";
import { useWorkspace } from "./workspace-provider";

export function NewLeadDialog({ onClose }: { onClose: () => void }) {
  const { dispatch } = useWorkspace();
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = leadInputSchema.safeParse({
      ...Object.fromEntries(form),
      adultCount: Number(form.get("adultCount")),
      childCount: Number(form.get("childCount")),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    const id = crypto.randomUUID();
    if (
      dispatch(
        {
          type: "ADD_LEAD",
          lead: {
            ...parsed.data,
            id,
            code: `DEMO-${id.slice(0, 6).toUpperCase()}`,
            status: "NEW",
            source: "Manuel kayıt",
            createdAt: new Date().toISOString(),
            isDemo: true,
          },
        },
        "Demo lead kaydedildi.",
      )
    )
      onClose();
  }
  return (
    <Dialog
      title="Yeni demo lead"
      description="Akışı denemek için örnek bilgiler girin. Bu kayıt TurTakip'e gönderilmez."
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-body">
        <div className="form-grid">
          <label>
            Ad soyad
            <input
              name="fullName"
              required
              minLength={3}
              maxLength={100}
              placeholder="Örn. Demo Misafir"
              autoFocus
              autoComplete="off"
            />
          </label>
          <label>
            Telefon
            <input
              name="phone"
              type="tel"
              required
              placeholder="0500 000 00 00"
              autoComplete="off"
            />
          </label>
          <label>
            E-posta <span className="optional">(isteğe bağlı)</span>
            <input
              name="email"
              type="email"
              defaultValue=""
              placeholder="demo@example.com"
            />
          </label>
          <label>
            Şehir
            <input name="city" maxLength={80} placeholder="İstanbul" />
          </label>
          <label className="full-width">
            Tur tercihi
            <select name="tourName" required defaultValue="">
              <option value="" disabled>
                Bir örnek tur seçin
              </option>
              {demoDepartures.map((departure) => (
                <option key={departure.id}>{departure.tourName}</option>
              ))}
            </select>
          </label>
          <label>
            Yetişkin sayısı
            <input
              name="adultCount"
              type="number"
              required
              min={1}
              max={50}
              defaultValue={2}
            />
          </label>
          <label>
            Çocuk sayısı
            <input
              name="childCount"
              type="number"
              required
              min={0}
              max={50}
              defaultValue={0}
            />
          </label>
          <label className="full-width">
            Talep notu
            <textarea
              name="notes"
              rows={3}
              maxLength={2000}
              placeholder="Misafirin tur tercihleri ve beklentileri…"
            />
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button className="button primary" type="submit">
            <Plus size={16} /> Lead oluştur
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function LeadDetailDialog({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const { state, dispatch } = useWorkspace();
  const [tab, setTab] = useState<"details" | "result" | "reservation">(
    "details",
  );
  const [notes, setNotes] = useState(lead.notes);
  const [error, setError] = useState("");
  const calls = state.calls.filter((call) => call.leadId === lead.id);
  const reservation = state.reservations.find(
    (item) => item.leadId === lead.id,
  );
  const departures = demoDepartures.filter(
    (departure) => departure.tourName === lead.tourName,
  );
  function recordResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const summary = String(form.get("summary") ?? "").trim();
    if (summary.length < 5) {
      setError("Görüşme özetini en az 5 karakter ile yazın.");
      return;
    }
    if (
      dispatch(
        {
          type: "RECORD_CALL",
          call: {
            id: crypto.randomUUID(),
            leadId: lead.id,
            outcome: form.get("outcome") as Outcome,
            summary,
            createdAt: new Date().toISOString(),
            isDemo: true,
          },
        },
        "Demo görüşme sonucu kaydedildi. Gerçek arama yapılmadı.",
      )
    ) {
      setTab("details");
      setError("");
    }
  }
  function createReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const departure = departures.find(
      (item) => item.id === form.get("departureId"),
    );
    if (!departure || !calls[0]) {
      setError("Tur kalkışı ve uygun görüşme sonucu gerekli.");
      return;
    }
    const passengers = String(form.get("passengers") ?? "")
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
    if (
      passengers.length !== lead.adultCount + lead.childCount ||
      passengers.some((name) => name.length < 3)
    ) {
      setError(
        `Her satıra bir ad soyad yazarak ${lead.adultCount + lead.childCount} yolcuyu tamamlayın.`,
      );
      return;
    }
    const id = crypto.randomUUID();
    if (
      dispatch(
        {
          type: "CREATE_DRAFT",
          reservation: {
            id,
            code: `TAS-${id.slice(0, 6).toUpperCase()}`,
            leadId: lead.id,
            callId: calls[0].id,
            departureId: departure.id,
            departureLabel: departure.label,
            passengers,
            createdAt: new Date().toISOString(),
            status: "LOCAL_DRAFT",
            isDemo: true,
          },
        },
        "Yerel rezervasyon taslağı oluşturuldu. TurTakip'e aktarılmadı.",
      )
    ) {
      setTab("details");
      setError("");
    }
  }
  return (
    <Dialog
      title={lead.fullName}
      description={`${lead.code} · ${lead.source} · Örnek kayıt`}
      onClose={onClose}
      wide
    >
      <div className="detail-summary">
        <span className={`badge status-${lead.status}`}>
          {statusLabels[lead.status]}
        </span>
        <span>
          <MapPin size={14} /> {lead.city || "Şehir belirtilmedi"}
        </span>
        <span>
          <UsersRound size={14} /> {lead.adultCount} yetişkin
          {lead.childCount > 0 && `, ${lead.childCount} çocuk`}
        </span>
      </div>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label="Lead detayları"
        onKeyDown={(event) => {
          const tabs = ["details", "result", "reservation"] as const;
          let index = tabs.indexOf(tab);
          if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
          else if (event.key === "ArrowLeft")
            index = (index + tabs.length - 1) % tabs.length;
          else if (event.key === "Home") index = 0;
          else if (event.key === "End") index = tabs.length - 1;
          else return;
          event.preventDefault();
          setTab(tabs[index]);
          setError("");
          event.currentTarget
            .querySelectorAll<HTMLButtonElement>("[role=tab]")
            [index]?.focus();
        }}
      >
        {(
          [
            ["details", "Lead bilgileri"],
            ["result", "Görüşme sonucu"],
            ["reservation", "Rezervasyon"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            id={`tab-${value}`}
            role="tab"
            tabIndex={tab === value ? 0 : -1}
            aria-selected={tab === value}
            aria-controls={`panel-${value}`}
            className={tab === value ? "selected" : ""}
            onClick={() => {
              setTab(value);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="detail-body"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "details" && (
          <>
            <div className="contact-grid">
              <div>
                <Phone size={16} />
                <span>
                  <small>Telefon</small>
                  {lead.phone}
                </span>
              </div>
              <div>
                <Mail size={16} />
                <span>
                  <small>E-posta</small>
                  {lead.email || "Belirtilmedi"}
                </span>
              </div>
              <div>
                <MapPin size={16} />
                <span>
                  <small>Tur tercihi</small>
                  {lead.tourName}
                </span>
              </div>
              <div>
                <CalendarDays size={16} />
                <span>
                  <small>Talep tarihi</small>
                  {dateLabel(lead.createdAt)}
                </span>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                dispatch(
                  { type: "SAVE_NOTES", leadId: lead.id, notes },
                  "Lead notu kaydedildi.",
                );
              }}
            >
              <label>
                Talep ve operasyon notları
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={2000}
                  rows={3}
                />
              </label>
              <div className="inline-actions">
                <button className="button secondary small" type="submit">
                  <Save size={14} /> Notu kaydet
                </button>
                {["NEW", "FOLLOW_UP", "UNREACHABLE"].includes(lead.status) && (
                  <button
                    className="button secondary small"
                    type="button"
                    onClick={() =>
                      dispatch(
                        { type: "QUEUE", leadId: lead.id },
                        "Demo arama sırasına alındı. Verimor bağlı olmadığı için arama başlamaz.",
                      )
                    }
                  >
                    <Clock3 size={14} /> Demo sırasına al
                  </button>
                )}
              </div>
            </form>
            <div className="section-heading">
              <h3>Görüşme geçmişi</h3>
              <span className="muted">{calls.length} sonuç</span>
            </div>
            {calls.length === 0 ? (
              <p className="subtle-box">
                Henüz görüşme sonucu yok. Görüşme sonucu sekmesinden akışı
                deneyebilirsiniz.
              </p>
            ) : (
              <div className="timeline">
                {calls.map((call) => (
                  <article key={call.id}>
                    <span className="timeline-dot" />
                    <div>
                      <div className="timeline-heading">
                        <strong>{outcomeLabels[call.outcome]}</strong>
                        <small>{dateLabel(call.createdAt)}</small>
                      </div>
                      <p>{call.summary}</p>
                      <span className="test-label">
                        Demo sonuç · Gerçek arama yapılmadı
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "result" &&
          (reservation ? (
            <div className="subtle-box">
              <Check size={20} />
              <p>
                Bu lead için rezervasyon taslağı oluşturuldu. Görüşme geçmişini
                Lead bilgileri sekmesinde inceleyebilirsiniz.
              </p>
            </div>
          ) : (
            <form onSubmit={recordResult}>
              <div className="notice">
                <Phone size={18} />
                <p>
                  <strong>Görüşme akışını deneyin</strong>Verimor henüz bağlı
                  değil. Burada yalnızca örnek bir sonuç kaydedilir.
                </p>
              </div>
              <label>
                Görüşme sonucu
                <select name="outcome" defaultValue="QUALIFIED">
                  {Object.entries(outcomeLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Görüşme özeti
                <textarea
                  name="summary"
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={5}
                  placeholder="Örnek: Misafir iki kişilik Balkan turuna katılmak istiyor. Tur kalkışını ve yolcu bilgilerini teyit etmemiz gerekiyor."
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="dialog-actions">
                <button className="button primary" type="submit">
                  Demo sonucu kaydet <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ))}
        {tab === "reservation" &&
          (reservation ? (
            <div className="reservation-success">
              <span className="success-icon">
                <Ticket size={24} />
              </span>
              <h3>Taslak hazır</h3>
              <p>
                {reservation.code} · {reservation.departureLabel}
              </p>
              <div className="passenger-list">
                {reservation.passengers.map((name, index) => (
                  <div key={index}>
                    <span>{index + 1}</span>
                    {name}
                  </div>
                ))}
              </div>
              <p className="subtle-box">
                Bu taslak yalnızca demo çalışma alanında saklanır. TurTakip’e
                aktarılmadı ve kontenjan ayrılmadı.
              </p>
            </div>
          ) : lead.status !== "QUALIFIED" ? (
            <div className="empty-state compact">
              <Ticket size={32} />
              <h3>Önce görüşme sonucu gerekli</h3>
              <p>
                “Rezervasyon istiyor” sonucu kaydedildikten sonra yolcu ve
                kalkış bilgilerini tamamlayabilirsiniz.
              </p>
              <button
                className="button secondary"
                onClick={() => setTab("result")}
              >
                Görüşme sonucu ekle
              </button>
            </div>
          ) : (
            <form onSubmit={createReservation}>
              <div className="notice">
                <Ticket size={18} />
                <p>
                  <strong>Yerel rezervasyon taslağı</strong>TurTakip bağlantısı
                  kurulunca aktarım açılacak. Bu işlem gerçek rezervasyon
                  oluşturmaz.
                </p>
              </div>
              <label>
                Örnek tur kalkışı
                <select name="departureId" required defaultValue="">
                  <option disabled value="">
                    Kalkış seçin
                  </option>
                  {departures.map((departure) => (
                    <option key={departure.id} value={departure.id}>
                      {departure.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Yolcu adları · {lead.adultCount + lead.childCount} kişi
                <textarea
                  name="passengers"
                  required
                  rows={5}
                  placeholder={
                    "Her satıra bir yolcu adı soyadı\nDemo Misafir\nÖrnek Yolcu"
                  }
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="dialog-actions">
                <button className="button primary" type="submit">
                  <Ticket size={16} /> Demo taslağı oluştur
                </button>
              </div>
            </form>
          ))}
      </div>
    </Dialog>
  );
}
