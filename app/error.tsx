"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>Ekran yüklenemedi.</h1>
      <p>Tekrar deneyerek çalışma alanınıza dönebilirsiniz.</p>
      <button className="button primary" onClick={reset}>
        Tekrar dene
      </button>
    </div>
  );
}
