import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Bu sayfa bulunamadı.</h1>
      <p>Lead merkezinden devam edebilirsiniz.</p>
      <Link className="button primary" href="/">
        Lead merkezine dön
      </Link>
    </div>
  );
}
