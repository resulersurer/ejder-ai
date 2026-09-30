export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

/** Validate without including connection credentials in any error message. */
export function getDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
) {
  const value = env.DATABASE_URL?.trim();
  if (!value || value.includes("[SENSITIVE]")) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL eksik veya Vercel Sensitive yer tutucusu içeriyor. Neon bağlantısını Development ortamına ekleyip .env.local dosyasını yeniden çekin.",
    );
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DatabaseConfigurationError(
      "DATABASE_URL geçerli bir PostgreSQL bağlantısı olmalı.",
    );
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.username ||
    !url.password ||
    url.pathname.length < 2
  ) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL kullanıcı, parola, sunucu ve veritabanı içeren bir PostgreSQL bağlantısı olmalı.",
    );
  }
  if (url.searchParams.get("sslmode") === "disable") {
    throw new DatabaseConfigurationError(
      "Veritabanı bağlantısında TLS kapatılamaz.",
    );
  }
  return value;
}

/** Driver messages may contain SQL, user input or URLs. Log only safe codes. */
export function safeDatabaseError(error: unknown) {
  if (error instanceof DatabaseConfigurationError) return error.message;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  return /^[A-Z0-9]{5}$/.test(code)
    ? `Veritabanı işlemi başarısız (SQLSTATE ${code}).`
    : "Veritabanına erişilemedi. Bağlantıyı ve ortam ayarlarını kontrol edin.";
}
