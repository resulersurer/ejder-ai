import {
  Bot,
  Cable,
  CheckCircle2,
  CircleAlert,
  Phone,
  Route,
} from "lucide-react";
import { getTurTakipTours, TurTakipConfigurationError } from "@/lib/turtakip";
import { getTourAiConfigurations } from "@/lib/tour-ai";
import { TourAiCard } from "./tour-ai-card";

export async function TourAiPage() {
  let tours = [] as Awaited<ReturnType<typeof getTurTakipTours>>;
  let configurations = [] as Awaited<
    ReturnType<typeof getTourAiConfigurations>
  >;
  let connectionError = "";
  try {
    [tours, configurations] = await Promise.all([
      getTurTakipTours(),
      getTourAiConfigurations(),
    ]);
  } catch (error) {
    connectionError =
      error instanceof TurTakipConfigurationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Tur ve eşleştirme bilgileri alınamadı.";
  }

  const configurationByTour = new Map(
    configurations.map((configuration) => [
      configuration.tourId,
      configuration,
    ]),
  );
  const configuredCount = tours.filter((tour) =>
    configurationByTour.has(tour.id),
  ).length;
  const activeCount = configurations.filter(
    (configuration) => configuration.enabled,
  ).length;

  return (
    <div className="workspace-content tour-ai-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow page-eyebrow">
            <span className="tiny-dot orange" /> CANLI TUR YÖNLENDİRME
          </div>
          <h1>Tur &amp; AI eşleştirme</h1>
          <p>
            TurTakip’teki her turu aranacak numara ve görevli AI danışmanıyla
            eşleştirin.
          </p>
        </div>
        <span
          className={`connection-state ${connectionError ? "error" : "ready"}`}
        >
          {connectionError ? (
            <CircleAlert size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {connectionError ? "Bağlantı bekliyor" : "TurTakip bağlı"}
        </span>
      </div>

      <div className="tour-ai-flow" aria-label="Tur yönlendirme akışı">
        <div>
          <span>
            <Route size={18} />
          </span>
          <strong>TurTakip turu</strong>
          <small>Canlı tur ve kalkış bilgisi</small>
        </div>
        <Cable size={17} />
        <div>
          <span>
            <Phone size={18} />
          </span>
          <strong>Telefon numarası</strong>
          <small>Bu tur için aranacak hat</small>
        </div>
        <Cable size={17} />
        <div>
          <span>
            <Bot size={18} />
          </span>
          <strong>AI danışmanı</strong>
          <small>Görev ve konuşma talimatı</small>
        </div>
      </div>

      {connectionError ? (
        <section className="panel integration-empty">
          <CircleAlert size={28} />
          <div>
            <h2>TurTakip bağlantısı tamamlanmalı</h2>
            <p>{connectionError}</p>
            <small>
              Vercel’de TURTAKIP_API_URL ve TURTAKIP_INTEGRATION_KEY
              tanımlandığında turlar burada otomatik görünecek.
            </small>
          </div>
        </section>
      ) : (
        <>
          <div className="tour-ai-metrics">
            <div>
              <small>CANLI TUR</small>
              <strong>{tours.length}</strong>
            </div>
            <div>
              <small>EŞLEŞTİRİLEN</small>
              <strong>{configuredCount}</strong>
            </div>
            <div>
              <small>AKTİF YÖNLENDİRME</small>
              <strong>{activeCount}</strong>
            </div>
          </div>
          <div className="tour-ai-toolbar">
            <div>
              <h2>Tur yönlendirmeleri</h2>
              <p>Değişiklikler Ejder AI veritabanında saklanır.</p>
            </div>
            <span>{tours.length} güncel tur</span>
          </div>
          {tours.length ? (
            <div className="tour-ai-grid">
              {tours.map((tour) => (
                <TourAiCard
                  key={tour.id}
                  tour={tour}
                  configuration={configurationByTour.get(tour.id)}
                />
              ))}
            </div>
          ) : (
            <section className="panel integration-empty">
              <Route size={28} />
              <div>
                <h2>Gelecek tarihli yayınlanmış tur yok</h2>
                <p>
                  TurTakip’te yayınlanmış ve gelecek kalkışı olan turlar burada
                  görünür.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
