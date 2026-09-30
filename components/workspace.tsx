"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Check,
  ChevronRight,
  FlaskConical,
  Inbox,
  Layers3,
  Link2,
  ListFilter,
  Phone,
  Plug,
  Plus,
  RotateCcw,
  Search,
  Ticket,
  UsersRound,
  Waypoints,
} from "lucide-react";
import {
  dateLabel,
  filterLeads,
  leadStatuses,
  outcomeLabels,
  statusLabels,
  type Lead,
} from "@/lib/domain";
import { sections, type Section } from "@/lib/navigation";
import { useWorkspace } from "./workspace-provider";
import { LeadDetailDialog, NewLeadDialog } from "./lead-dialogs";
import { Dialog } from "./dialog";

export function Workspace({ section }: { section: Section }) {
  const { state, ready, reset } = useWorkspace();
  const [newLead, setNewLead] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetDialog, setResetDialog] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [newestFirst, setNewestFirst] = useState(true);
  const selectedLead = state.leads.find((lead) => lead.id === selectedId);
  const config = sections[section];
  const waiting = state.leads.filter((lead) =>
    ["NEW", "QUEUED", "FOLLOW_UP", "UNREACHABLE"].includes(lead.status),
  ).length;
  const qualified = state.leads.filter((lead) =>
    ["QUALIFIED", "DRAFT"].includes(lead.status),
  ).length;
  const filtered = filterLeads(state.leads, query, status, source).sort(
    (a, b) =>
      newestFirst
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
  );
  return (
    <div className="workspace-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow page-eyebrow">
            <span className="tiny-dot orange" />{" "}
            {section === "overview"
              ? "OPERASYON MERKEZİ"
              : "EJDER AI WORKSPACE"}
          </div>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        {["overview", "leads"].includes(section) && (
          <button
            className="button primary"
            disabled={!ready}
            onClick={() => setNewLead(true)}
          >
            <Plus size={17} /> Demo lead ekle
          </button>
        )}
      </div>
      {!ready ? (
        <div className="loading-state" aria-live="polite">
          <span className="loading-dot" /> Çalışma alanı yükleniyor…
        </div>
      ) : (
        <>
          {["overview", "leads"].includes(section) && (
            <>
              <div className="metrics">
                <Metric
                  label="TOPLAM LEAD"
                  value={state.leads.length}
                  icon={<UsersRound size={19} />}
                  note="Çalışma alanındaki örnek talepler"
                />
                <Metric
                  label="GÖRÜŞME BEKLEYEN"
                  value={waiting}
                  icon={<Phone size={19} />}
                  note="İlk arama ve tekrar görüşmeler"
                />
                <Metric
                  label="REZERVASYONA UYGUN"
                  value={qualified}
                  icon={<Ticket size={19} />}
                  note="Olumlu görüşme sonucu olanlar"
                  accent
                />
                <Metric
                  label="GÖRÜŞME SONUCU"
                  value={state.calls.length}
                  icon={<AudioLines size={19} />}
                  note="Manuel kaydedilen demo sonuçlar"
                />
              </div>
              <div
                className={`overview-grid ${section === "leads" ? "full-grid" : ""}`}
              >
                <section
                  className="panel leads-panel"
                  aria-labelledby="leads-title"
                >
                  <div className="panel-heading">
                    <div>
                      <h2 id="leads-title">
                        {section === "overview" ? "Lead akışı" : "Tüm lead'ler"}{" "}
                        <span className="count-label">
                          {state.leads.length}
                        </span>
                      </h2>
                      <p>Bir sonraki yolculuk burada başlıyor.</p>
                    </div>
                    <span className="sample-tag">
                      <FlaskConical size={13} /> Örnek veriler
                    </span>
                  </div>
                  <div className="filter-tabs" aria-label="Hızlı lead filtresi">
                    {[
                      ["ALL", "Tüm lead'ler", state.leads.length],
                      [
                        "NEW",
                        "Yeni",
                        state.leads.filter((l) => l.status === "NEW").length,
                      ],
                      [
                        "QUEUED",
                        "Sırada",
                        state.leads.filter((l) => l.status === "QUEUED").length,
                      ],
                      [
                        "QUALIFIED",
                        "Rezervasyona hazır",
                        state.leads.filter((l) => l.status === "QUALIFIED")
                          .length,
                      ],
                    ].map(([value, label, count]) => (
                      <button
                        key={value}
                        className={status === value ? "selected" : ""}
                        aria-pressed={status === value}
                        onClick={() => setStatus(String(value))}
                      >
                        {label}
                        <span>{count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="table-toolbar">
                    <div className="search-field">
                      <Search size={16} />
                      <input
                        type="search"
                        aria-label="Lead ara"
                        placeholder="İsim, telefon veya tur ara…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>
                    <label className="select-control">
                      <ListFilter size={15} />
                      <select
                        aria-label="Lead durumu"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                      >
                        <option value="ALL">Tüm durumlar</option>
                        {leadStatuses.map((value) => (
                          <option key={value} value={value}>
                            {statusLabels[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {section === "leads" && (
                      <label className="select-control">
                        <select
                          aria-label="Lead kaynağı"
                          value={source}
                          onChange={(event) => setSource(event.target.value)}
                        >
                          <option value="ALL">Tüm kaynaklar</option>
                          <option>TurTakip formu</option>
                          <option>Manuel kayıt</option>
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="table-scroll">
                    <table className="lead-table">
                      <thead>
                        <tr>
                          <th>MÜŞTERİ</th>
                          <th>TUR TERCİHİ</th>
                          <th>DURUM</th>
                          <th>
                            <button
                              className="sort-button"
                              onClick={() => setNewestFirst(!newestFirst)}
                              aria-label={
                                newestFirst
                                  ? "Eskiden yeniye sırala"
                                  : "Yeniden eskiye sırala"
                              }
                            >
                              KAYIT TARİHİ{" "}
                              <ArrowDown
                                size={12}
                                style={{
                                  transform: newestFirst
                                    ? undefined
                                    : "rotate(180deg)",
                                }}
                              />
                            </button>
                          </th>
                          <th>
                            <span className="sr-only">İşlem</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((lead, index) => (
                          <LeadRow
                            key={lead.id}
                            lead={lead}
                            index={index}
                            onOpen={() => setSelectedId(lead.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length === 0 && (
                    <div className="empty-state compact">
                      <Search size={28} />
                      <h3>Eşleşen lead bulunamadı</h3>
                      <p>Arama veya filtrelerinizi değiştirmeyi deneyin.</p>
                      <button
                        className="button secondary small"
                        onClick={() => {
                          setQuery("");
                          setStatus("ALL");
                          setSource("ALL");
                        }}
                      >
                        Filtreleri temizle
                      </button>
                    </div>
                  )}
                  <div className="table-footer">
                    <span>
                      {filtered.length} / {state.leads.length} lead gösteriliyor
                    </span>
                    <span>Yalnızca demo kayıtlar</span>
                  </div>
                </section>
                {section === "overview" && (
                  <aside className="insights">
                    <FlowCard />
                    <section className="panel activity-panel">
                      <div className="panel-heading">
                        <h2>Son görüşmeler</h2>
                        <AudioLines size={18} />
                      </div>
                      <div className="activity-list">
                        {state.calls.slice(0, 3).map((call) => {
                          const lead = state.leads.find(
                            (item) => item.id === call.leadId,
                          );
                          return (
                            <button
                              key={call.id}
                              onClick={() => setSelectedId(call.leadId)}
                              className="activity-item"
                            >
                              <span
                                className={`activity-icon ${call.outcome === "QUALIFIED" ? "green" : ""}`}
                              >
                                {call.outcome === "QUALIFIED" ? (
                                  <Check size={15} />
                                ) : (
                                  <Phone size={15} />
                                )}
                              </span>
                              <span>
                                <strong>{lead?.fullName}</strong>
                                <small>{outcomeLabels[call.outcome]}</small>
                                <time>{dateLabel(call.createdAt)}</time>
                              </span>
                              <ChevronRight size={14} />
                            </button>
                          );
                        })}
                      </div>
                      <Link className="panel-link" href="/calls">
                        Tüm görüşmeleri gör <ArrowRight size={15} />
                      </Link>
                    </section>
                  </aside>
                )}
              </div>
            </>
          )}
          {section === "calls" && (
            <>
              <div className="section-notice">
                <Phone size={20} />
                <div>
                  <strong>Görüşme akışı hazırlık aşamasında</strong>
                  <p>
                    Buradaki sonuçlar demo kayıtlarıdır. Verimor bağlandığında
                    gerçek görüşmeler bu ekranda takip edilecek.
                  </p>
                </div>
                <Link className="text-link" href="/leads">
                  Lead seç <ArrowRight size={16} />
                </Link>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>
                    Görüşme geçmişi{" "}
                    <span className="count-label">{state.calls.length}</span>
                  </h2>
                  <span className="sample-tag">Demo sonuçlar</span>
                </div>
                <div className="call-list">
                  {state.calls.map((call) => {
                    const lead = state.leads.find(
                      (item) => item.id === call.leadId,
                    );
                    return (
                      <article className="call-card" key={call.id}>
                        <div className="call-icon">
                          <AudioLines size={23} />
                        </div>
                        <div className="call-copy">
                          <div className="call-title">
                            <button
                              className="name-button"
                              onClick={() => setSelectedId(call.leadId)}
                            >
                              {lead?.fullName}
                            </button>
                            <span className={`badge status-${call.outcome}`}>
                              {outcomeLabels[call.outcome]}
                            </span>
                          </div>
                          <p>{call.summary}</p>
                          <div className="call-meta">
                            <span>{lead?.tourName}</span>
                            <span>{dateLabel(call.createdAt)}</span>
                            <span>Gerçek arama yapılmadı</span>
                          </div>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={`${lead?.fullName} görüşmesini incele`}
                          onClick={() => setSelectedId(call.leadId)}
                        >
                          <ArrowUpRight size={19} />
                        </button>
                      </article>
                    );
                  })}
                </div>
                {state.calls.length === 0 && (
                  <div className="empty-state">
                    <AudioLines size={30} />
                    <h3>Henüz görüşme sonucu yok</h3>
                    <p>Bir lead seçerek ilk demo sonucunuzu kaydedin.</p>
                    <Link className="button primary" href="/leads">
                      Lead merkezine git
                    </Link>
                  </div>
                )}
              </section>
            </>
          )}
          {section === "reservations" && (
            <>
              <div className="section-notice">
                <Ticket size={20} />
                <div>
                  <strong>TurTakip aktarımı henüz bağlı değil</strong>
                  <p>
                    Bu ekran yalnızca yerel taslakları gösterir. Gerçek
                    rezervasyon veya kontenjan kaydı oluşturulmaz.
                  </p>
                </div>
                <Link className="text-link" href="/integrations">
                  Bağlantı durumu <ArrowRight size={16} />
                </Link>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>
                    Hazırlanan taslaklar{" "}
                    <span className="count-label">
                      {state.reservations.length}
                    </span>
                  </h2>
                </div>
                {state.reservations.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <Ticket size={29} />
                    </span>
                    <h3>Yeni yolculuklara yer açın.</h3>
                    <p>
                      Rezervasyon isteyen bir lead’in kalkış ve yolcu
                      bilgilerini tamamlayın. Oluşturduğunuz taslak burada
                      görünecek.
                    </p>
                    <Link href="/leads" className="button primary">
                      Lead’leri incele <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="reservation-grid">
                    {state.reservations.map((reservation) => {
                      const lead = state.leads.find(
                        (item) => item.id === reservation.leadId,
                      );
                      return (
                        <button
                          className="reservation-card"
                          key={reservation.id}
                          onClick={() => setSelectedId(reservation.leadId)}
                        >
                          <div>
                            <span className="eyebrow">{reservation.code}</span>
                            <Ticket size={20} />
                          </div>
                          <h3>{lead?.fullName}</h3>
                          <p>{reservation.departureLabel}</p>
                          <div className="reservation-card-bottom">
                            <span>
                              <UsersRound size={14} />{" "}
                              {reservation.passengers.length} yolcu
                            </span>
                            <span className="badge status-FOLLOW_UP">
                              Yerel taslak
                            </span>
                          </div>
                          <small>TurTakip’e aktarılmadı</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
          {section === "integrations" && (
            <>
              <div className="integration-grid">
                <IntegrationCard
                  icon={<Layers3 size={24} />}
                  name="TurTakip"
                  subtitle="Lead kaynağı"
                  description="Form talepleri Ejder AI'a güvenli bir bağlantı ile aktarılacak."
                  phase="Sıradaki adım"
                />
                <IntegrationCard
                  icon={<Ticket size={24} />}
                  name="Admin rezervasyon"
                  subtitle="Sonuç aktarımı"
                  description="Uygun görüşmeler, yolcu ve kalkış bilgileriyle TurTakip'e iletilecek."
                  phase="Planlandı"
                />
                <IntegrationCard
                  icon={<Phone size={24} />}
                  name="Verimor"
                  subtitle="Telefon bağlantısı"
                  description="Telefon araması ve sesli yapay zekâ bağlantısı son aşamada yapılacak."
                  phase="Son aşama"
                />
              </div>
              <section className="panel roadmap">
                <div className="panel-heading">
                  <div>
                    <h2>Kurulum yol haritası</h2>
                    <p>
                      Önce sağlam bir operasyon, ardından canlı bağlantılar.
                    </p>
                  </div>
                  <Waypoints size={22} />
                </div>
                {[
                  [
                    "01",
                    "Çalışma alanı ve lead yönetimi",
                    "Örnek kayıtlar, görüşme sonuçları ve yerel rezervasyon taslakları.",
                    true,
                  ],
                  [
                    "02",
                    "Güvenli erişim ve kalıcı veri tabanı",
                    "Ekip oturumları, sunucu tarafında kayıt ve yetkilendirme.",
                    false,
                  ],
                  [
                    "03",
                    "TurTakip ile veri alışverişi",
                    "Form taleplerini alma, sonuçları rezervasyon ekranına aktarma.",
                    false,
                  ],
                  [
                    "04",
                    "Sesli yapay zekâ ve Verimor",
                    "Gerçek görüşmeler, sonuç bildirimleri ve uçtan uca test.",
                    false,
                  ],
                ].map(([step, title, description, done]) => (
                  <div className="roadmap-item" key={String(step)}>
                    <span className={`step-number ${done ? "done" : ""}`}>
                      {done ? <Check size={17} /> : step}
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                    <span
                      className={`badge ${done ? "status-QUALIFIED" : "status-QUEUED"}`}
                    >
                      {done ? "Demo hazır" : "Bekliyor"}
                    </span>
                  </div>
                ))}
              </section>
              <section className="panel demo-settings">
                <div>
                  <h2>Demo çalışma alanı</h2>
                  <p>
                    Bu tarayıcıdaki değişiklikleri kaldırıp başlangıçtaki örnek
                    kayıtlara dönebilirsiniz.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setResetDialog(true)}
                >
                  <RotateCcw size={16} /> Demo verilerini sıfırla
                </button>
              </section>
            </>
          )}
        </>
      )}
      {newLead && <NewLeadDialog onClose={() => setNewLead(false)} />}
      {selectedLead && (
        <LeadDetailDialog
          key={selectedLead.id}
          lead={selectedLead}
          onClose={() => setSelectedId(null)}
        />
      )}
      {resetDialog && (
        <Dialog
          title="Demo verileri sıfırlansın mı?"
          description="Bu tarayıcıda eklediğiniz lead'ler, notlar, görüşme sonuçları ve taslaklar silinerek örnek kayıtlar geri yüklenecek."
          onClose={() => setResetDialog(false)}
        >
          <div className="dialog-actions padded">
            <button
              className="button secondary"
              onClick={() => setResetDialog(false)}
            >
              Vazgeç
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (reset()) setResetDialog(false);
              }}
            >
              Sıfırla
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  note,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? "accent-metric" : ""}`}>
      <div className="metric-heading">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{String(value).padStart(2, "0")}</strong>
      <p>
        <span className="tiny-dot" /> {note}
      </p>
    </div>
  );
}

function LeadRow({
  lead,
  index,
  onOpen,
}: {
  lead: Lead;
  index: number;
  onOpen: () => void;
}) {
  return (
    <tr>
      <td>
        <div className="customer">
          <span className={`customer-avatar avatar-${index % 4}`}>
            {lead.fullName
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <button className="name-button" onClick={onOpen}>
              {lead.fullName}
            </button>
            <small>{lead.phone}</small>
          </div>
        </div>
      </td>
      <td>
        <span className="tour-name">{lead.tourName}</span>
        <small className="table-secondary">
          {lead.adultCount + lead.childCount} kişi <span>·</span> {lead.source}
        </small>
      </td>
      <td>
        <span className={`badge status-${lead.status}`}>
          <span className="tiny-dot" />
          {statusLabels[lead.status]}
        </span>
      </td>
      <td>
        <span className="table-date">{dateLabel(lead.createdAt)}</span>
      </td>
      <td>
        <button
          className="icon-button row-open"
          aria-label={`${lead.fullName} detayını aç`}
          onClick={onOpen}
        >
          <ArrowUpRight size={18} />
        </button>
      </td>
    </tr>
  );
}

function FlowCard() {
  return (
    <section className="flow-card">
      <div className="flow-top">
        <span className="eyebrow">TALEPTEN REZERVASYONA</span>
        <Waypoints size={19} />
      </div>
      <h2>Her adım birbirine bağlı.</h2>
      <p>
        Ekibiniz için daha az takip,
        <br />
        misafirleriniz için daha iyi deneyim.
      </p>
      <div className="flow-steps">
        <div>
          <span>
            <Inbox size={17} />
          </span>
          <div>
            <strong>Talep gelir</strong>
            <small>TurTakip formu</small>
          </div>
          <span className="flow-label">PLANLANDI</span>
        </div>
        <div className="current">
          <span>
            <AudioLines size={17} />
          </span>
          <div>
            <strong>Görüşme yönetilir</strong>
            <small>Ejder AI çalışma alanı</small>
          </div>
          <span className="flow-label">DEMO</span>
        </div>
        <div>
          <span>
            <Ticket size={17} />
          </span>
          <div>
            <strong>Yolculuk başlar</strong>
            <small>Admin rezervasyon</small>
          </div>
          <span className="flow-label">PLANLANDI</span>
        </div>
      </div>
      <Link href="/integrations">
        Akışı incele <ArrowRight size={15} />
      </Link>
    </section>
  );
}

function IntegrationCard({
  icon,
  name,
  subtitle,
  description,
  phase,
}: {
  icon: React.ReactNode;
  name: string;
  subtitle: string;
  description: string;
  phase: string;
}) {
  return (
    <section className="panel integration-card">
      <div className="integration-top">
        <span className="integration-icon">{icon}</span>
        <span className="badge status-QUEUED">
          <Plug size={12} /> Bağlı değil
        </span>
      </div>
      <small className="eyebrow">{subtitle}</small>
      <h2>{name}</h2>
      <p>{description}</p>
      <div className="integration-bottom">
        <Link2 size={15} />
        <span>{phase}</span>
      </div>
    </section>
  );
}
