# Neon PostgreSQL kurulumu

Vercel projesi: `resulersurer/ejder-ai`. Mevcut Neon bağlantısı yeniden kullanılacak; ikinci bir veritabanı oluşturulmaz.

## Ortam değişkenleri

Uygulama yalnızca sunucu tarafında `DATABASE_URL` kullanır. Bağlantı tarayıcıya gönderilmez. `lib/database/client.ts` modülü `server-only` ile korunur ve istemci ihtiyaç anında oluşturulur; build sırasında bağlantı gerekmez.

Neon değişkenleri Production, Preview ve Development ortamlarında tanımlıdır. Development bağlantısı gerçek bir salt okunur sorguyla doğrulandı ve `001_initial.sql` migration'ı bu bağlantının hedefindeki veritabanına uygulandı. Production değişkenleri Sensitive olduğundan CLI gerçek değerleri indirmez; Production hedefi ayrıca doğrulanmadı.

Yeni bir geliştirme ortamında Vercel bağlantısını kurup Development ayarlarını aşağıdaki komutlarla çekin. Geliştirme için ayrı bir Neon branch kullanılması tercih edilir. Bağlantıyı sohbete veya Git'e kopyalamayın.

```sh
npx vercel link --yes --project ejder-ai --scope resulersurer
npx vercel env pull .env.local --environment=development --yes
npm run db:check
```

`db:check` yalnızca salt okunur bir sorgu gönderir. Bağlantı ve tabloların varlığını raporlar; müşteri verileri, parolalar ve sunucu adresleri çıktıya yazılmaz. `[SENSITIVE]` yer tutucusu veya eksik URL varsa bağlantı denenmeden anlaşılır bir hata döner.

## Tablolar

`database/migrations/001_initial.sql`, ayrı `ejder_ai` şemasında aşağıdaki tabloları oluşturur:

- `leads`: müşteri talebi, TurTakip kaynak kimliği, iletişim/tur bilgileri, durum.
- `calls`: lead'e bağlı görüşme sonucu ve özet; sağlayıcı kimliği.
- `reservation_drafts`: uygun görüşmeye bağlı rezervasyon taslağı, kalkış, yolcular ve aktarım kimliği.
- Migration çalıştırıcısı ayrıca `schema_migrations` tablosunda uygulanmış dosyaların SHA-256 özetini tutar.

Kaynak kimliği tekrarı, lead başına ikinci taslak, başka bir lead'in görüşmesine bağlanan taslak, olumsuz görüşmeden taslak ve demo kaydının gerçek aktarıma alınması veritabanı kısıtlarıyla engellenir. Yolcu adlarının doğrulanması, kişi sayısının lead ile eşleşmesi, güncel görüşme ve tur kontenjanı kontrolleri servis katmanında ayrıca yapılmalıdır. `updated_at` alanları yazan servis tarafından güncellenmelidir.

## Migration

Vercel bağlantısı ve gerçek ortam değişkeni doğrulandıktan sonra:

```sh
npm run db:migrate
npm run db:check
```

Migration aynı transaction içinde uygulanır; bir hata tüm değişiklikleri geri alır. Advisory lock eşzamanlı kurulumları sıralar. Daha önce uygulanan dosya değişmişse çalışma durdurulur; yeni değişiklikler yeni migration dosyasıyla eklenir. Mevcut Neon Auth şeması ve diğer uygulamalar değiştirilmez. Demo seed yapılmaz.

Komutlar varsayılan olarak yalnızca `.env.local` okur. Başka ortamı bilinçli seçmek için `-- --env=.env.production.local` kullanılabilir; Sensitive yer tutucuları ile çalışmaz. Build sırasında migration otomatik çalıştırılmaz.

## Doğrulama sınırı

Şema testleri PGlite üzerinde yerel PostgreSQL motorunda çalışır; bu testler canlı Neon bağlantısının doğrulandığı anlamına gelmez. Panel hâlâ tarayıcıdaki demo verilerini kullanır. Kimlik doğrulama ve yetkili sunucu işlemleri tamamlanmadan canlı müşteri verisi panel üzerinden açılmaz. Bu aşamada herkese açık veri okuma, yazma veya migration endpoint'i eklenmez.
