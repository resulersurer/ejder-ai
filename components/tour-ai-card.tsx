"use client";

import { useActionState, useState } from "react";
import {
  Bot,
  CalendarDays,
  ChevronDown,
  Phone,
  Save,
  KeyRound,
} from "lucide-react";
import { saveTourAiAction } from "@/app/tour-ai-actions";
import type { TurTakipTour } from "@/lib/turtakip";
import { agentOptions, type TourAiConfiguration } from "@/lib/tour-ai-shared";

const initialState = { ok: false, message: "" };
const date = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));

export function TourAiCard({
  tour,
  configuration,
}: {
  tour: TurTakipTour;
  configuration?: TourAiConfiguration;
}) {
  const [open, setOpen] = useState(Boolean(configuration));
  const [state, action, pending] = useActionState(
    saveTourAiAction,
    initialState,
  );
  const firstDeparture = tour.departures[0];
  return (
    <article
      className={`tour-ai-card ${configuration?.enabled ? "is-active" : ""}`}
    >
      <button
        className="tour-ai-card-summary"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="tour-ai-card-icon">
          <Bot size={20} />
        </div>
        <div className="tour-ai-card-title">
          <div>
            <h3>{tour.name}</h3>
            {configuration?.enabled && (
              <span className="badge status-QUALIFIED">Aktif</span>
            )}
          </div>
          <p>
            <CalendarDays size={13} /> {tour.departures.length} kalkış
            {firstDeparture ? ` · İlki ${date(firstDeparture.startDate)}` : ""}
          </p>
        </div>
        {configuration ? (
          <div className="tour-ai-compact">
            <span>
              <Phone size={13} /> {configuration.phoneNumber}
            </span>
            <small>{configuration.aiDisplayName}</small>
          </div>
        ) : (
          <span className="badge status-QUEUED">Eşleştirilmedi</span>
        )}
        <ChevronDown className={open ? "rotated" : ""} size={18} />
      </button>
      {open && (
        <form action={action} className="tour-ai-form">
          <input type="hidden" name="tourId" value={tour.id} />
          <input type="hidden" name="tourName" value={tour.name} />
          <input type="hidden" name="tourSlug" value={tour.slug} />
          <div className="tour-ai-form-grid">
            <label>
              <span>
                <Phone size={14} /> Telefon numarası
              </span>
              <input
                name="phoneNumber"
                type="tel"
                required
                defaultValue={configuration?.phoneNumber ?? "+90"}
                placeholder="+908501234567"
              />
              <small>Verimor bağlantısı geldiğinde bu hat kullanılacak.</small>
            </label>
            <label>
              <span>
                <Bot size={14} /> AI danışmanı
              </span>
              <select
                name="agentKey"
                defaultValue={configuration?.agentKey ?? "SALES"}
              >
                {agentOptions.map((agent) => (
                  <option value={agent.key} key={agent.key}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <small>Konuşmanın temel görevini belirler.</small>
            </label>
            <label className="full-width">
              <span>Bu tura özel AI talimatı</span>
              <textarea
                name="instructions"
                rows={3}
                defaultValue={configuration?.instructions ?? ""}
                placeholder="Örn. Vize durumunu mutlaka belirt, Kasım kalkışını önceliklendir…"
              />
            </label>
            <label className="full-width">
              <span>
                <KeyRound size={14} /> Yönetim anahtarı
              </span>
              <input
                name="accessKey"
                type="password"
                required
                minLength={16}
                autoComplete="current-password"
                placeholder="Ayarları kaydetmek için"
              />
            </label>
          </div>
          <div className="tour-ai-form-footer">
            <label className="switch-label">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={configuration?.enabled ?? false}
              />
              <span /> Yönlendirmeyi aktif et
            </label>
            <div className="tour-ai-save">
              <span
                className={state.ok ? "success-text" : "error-text"}
                role="status"
              >
                {state.message}
              </span>
              <button className="button primary" disabled={pending}>
                {pending ? (
                  "Kaydediliyor…"
                ) : (
                  <>
                    <Save size={15} /> Eşleştirmeyi kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </article>
  );
}
