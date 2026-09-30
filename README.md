# Ejder AI

TurTakip form taleplerini, yapay zekâ görüşmelerini ve rezervasyon aktarımını tek bir operasyon akışında birleştirecek Next.js uygulaması.

**İlk sürüm demo çalışma alanıdır.** Gerçek müşteri bilgisi girmeyin. Telefon araması, TurTakip bağlantısı, sunucu veritabanına bağlı panel işlemleri ve kullanıcı girişi henüz yoktur. Verimor en son aşamada bağlanacaktır.

## Çalışan özellikler

- Genel bakış: lead, bekleyen görüşme ve rezervasyona uygun talep sayıları.
- Lead merkezi: örnek lead ekleme, Türkçe arama, kaynak/durum filtreleri ve tarih sıralaması.
- Lead detayı: iletişim ve tur bilgileri, not düzenleme, demo arama sırasına alma.
- Görüşmeler: manuel demo sonuçları ve görüşme geçmişi.
- Rezervasyonlar: olumlu sonuca sahip lead için kalkış ve yolcu bilgilerini doğrulayarak yerel taslak oluşturma. Aynı lead için ikinci taslak engellenir.
- Entegrasyonlar: gerçek bağlantı durumları, yol haritası ve onaylı demo sıfırlama.
- Mobil uyumlu arayüz ve yerel olarak paketlenmiş Inter yazı tipi.

Demo değişiklikleri `localStorage` içinde bu tarayıcıya kaydedilir. Yenileme ve sayfa geçişlerinde korunur; aynı tarayıcıdaki sekmeler güncellenir. Bu depolama merkezi veri tabanı değildir. Depolama kapalıysa veya kayıtlar bozulmuşsa uygulama bunu bildirir; başarısız kayıtları başarılı göstermez. Demo kayıtlarının tamamında `isDemo: true` bulunur ve hiçbir dış servise gönderilmezler.

## Yerel kurulum

Node.js 22 LTS veya daha yeni uyumlu bir sürüm ve npm kullanın.

```sh
npm ci
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır. Bu demo sürümü ortam değişkeni veya harici servis gerektirmez.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` öncesinde `npm run build` çalıştırılmalıdır. Testler telefon/alan doğrulamasını, görüşmeden taslağa geçişi, tekrar kaydı önlemeyi, yanlış tur ve eksik yolcu reddini, Türkçe filtrelemeyi ve bozuk depolama kayıtlarını kapsar.

## Vercel

Depoyu Vercel'e Next.js projesi olarak ekleyin. Kök dizin depo kökü, derleme komutu `npm run build`, kurulum komutu `npm ci` olarak kullanılabilir. Demo için ortam değişkeni gerekmez. Bu sürümde yönetici kimlik doğrulaması bulunmadığından gerçek müşteri verisi bağlanmamalıdır.

## Yapı

```text
app/                    Next.js App Router sayfaları, yerleşim ve stiller
components/             Çalışma alanı, lead pencereleri ve demo depolaması
lib/domain.ts           Veri şemaları, doğrulamalar ve durum geçişleri
lib/demo-data.ts         Tamamı kurgusal örnek kayıtlar
tests/domain.test.ts     İş akışı testleri
docs/architecture.md     TurTakip incelemesi ve entegrasyon tasarımı
```

## Sonraki aşamalar

Neon sunucu erişim katmanı, tablo migration'ı ve `db:check` / `db:migrate` komutları hazırdır. Ortam bağlantısı ve kurulum adımları [veritabanı notlarında](docs/database.md) yer alır. Panel henüz bu tabloları kullanmaz; demo kayıtları otomatik olarak veritabanına taşınmaz.

1. Yönetici oturumu ve kalıcı veri tabanı.
2. TurTakip form kayıtlarından güvenilir lead aktarımı.
3. Mevcut TurTakip rezervasyon servisine kimliği doğrulanmış, tekrar güvenli sonuç aktarımı.
4. Sesli yapay zekâ ve Verimor bağlantısı.

Entegrasyon ayrıntıları ve TurTakip kaynak kodunda doğrulanan bağlantı noktaları [mimari notlarında](docs/architecture.md) yer alır. Henüz webhook veya canlı rezervasyon endpoint'i uygulanmamıştır.
