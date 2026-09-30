import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function requireAdminAccess(provided: string) {
  const expected = process.env.ADMIN_ACCESS_KEY?.trim();
  if (!expected || expected.length < 16)
    throw new Error("Yönetim anahtarı henüz yapılandırılmadı.");
  if (!provided || !timingSafeEqual(digest(expected), digest(provided)))
    throw new Error("Yönetim anahtarı geçersiz.");
}
