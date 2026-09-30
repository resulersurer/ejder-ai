"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Plug,
  Ticket,
  UsersRound,
  X,
} from "lucide-react";
import { sections, type Section } from "@/lib/navigation";
import { useWorkspace } from "./workspace-provider";

const icons = {
  overview: LayoutDashboard,
  leads: UsersRound,
  calls: AudioLines,
  reservations: Ticket,
  integrations: Plug,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { state, ready, storageError, message, dismissMessage } =
    useWorkspace();
  const active = Object.entries(sections).find(
    ([, item]) => item.href === pathname,
  )?.[1];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        İçeriğe geç
      </a>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="main-navigation"
        className={`sidebar ${open ? "is-open" : ""}`}
      >
        <Link
          href="/"
          className="brand"
          onClick={() => setOpen(false)}
          aria-label="Ejder AI ana sayfa"
        >
          <span className="brand-icon">
            <AudioLines size={25} />
          </span>
          <span>
            ejder<span className="brand-ai">ai</span>
            <small>TRAVEL INTELLIGENCE</small>
          </span>
        </Link>
        <div className="workspace-switch">
          <span className="company-avatar">E</span>
          <div>
            <strong>Ejder Turizm</strong>
            <small>Operasyon çalışma alanı</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-heading">ÇALIŞMA ALANI</p>
        <nav aria-label="Ana menü">
          {(
            Object.entries(sections) as [Section, (typeof sections)[Section]][]
          ).map(([key, item]) => {
            const Icon = icons[key];
            return (
              <Link
                key={key}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`nav-item ${pathname === item.href ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {key === "leads" && ready && (
                  <span className="nav-count">{state.leads.length}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="setup-card">
            <span className="eyebrow">
              <span className="tiny-dot orange" /> KURULUM AŞAMASI
            </span>
            <h3>
              Bir sonraki adım:
              <br />
              TurTakip bağlantısı
            </h3>
            <p>Form taleplerini doğrudan çalışma alanınıza taşıyın.</p>
            <Link href="/integrations" onClick={() => setOpen(false)}>
              Entegrasyonları incele <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="profile">
            <span className="profile-avatar">ET</span>
            <div>
              <strong>Ejder ekibi</strong>
              <small>Demo çalışma alanı</small>
            </div>
            <span className="version">v0.1</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-button"
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={open}
              aria-controls="main-navigation"
              onClick={() => setOpen(!open)}
            >
              <Menu size={20} />
            </button>
            <span>Çalışma alanı</span>
            <ChevronRight size={14} />
            <strong>{active?.label ?? "Ejder AI"}</strong>
          </div>
          <div className="topbar-right">
            <span className="preview-pill">
              <FlaskConical size={13} /> Demo
            </span>
            <span className="topbar-avatar" aria-label="Ejder Turizm">
              ET
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="demo-banner">
            <FlaskConical size={15} />
            <span>
              <strong>Önizleme çalışma alanı.</strong> Örnek kayıtlarla deneyin;
              gerçek müşteri bilgisi girmeyin. Değişiklikler yalnızca bu
              tarayıcıya kaydedilir.
            </span>
          </div>
          {storageError && (
            <div className="error-banner" role="alert">
              {storageError}{" "}
              <Link href="/integrations">Demo ayarlarına git</Link>
            </div>
          )}
          {children}
        </main>
        <footer className="footer">
          <span>
            Ejder AI <span className="muted">/</span> Daha iyi görüşmeler, yeni
            yolculuklar.
          </span>
          <span>
            <span className="tiny-dot" /> Verimor bağlantısı sonraki aşamada
          </span>
        </footer>
      </div>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Bildirimi kapat"
            onClick={dismissMessage}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
