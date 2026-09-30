# Ejder AI

TurTakip formlarından gelen müşteri taleplerini (lead) alan, yapay zekâ destekli telefon görüşmelerini yöneten ve görüşme sonucunu admin rezervasyon ekranına aktaran yeni proje.

## Kararlaştırılan teknoloji

- Uygulama: Next.js ve TypeScript
- Barındırma: Vercel
- Telefon bağlantısı: Verimor; entegrasyonu en son aşamada yapılacak.
- Kaynak depo: https://github.com/resulersurer/ejder-ai

## Hedef akış

1. Müşteri TurTakip formunu doldurur.
2. TurTakip, kendi lead kaydını oluşturduktan sonra Ejder AI'a sunucudan sunucuya bir bildirim gönderir.
3. Ejder AI lead'i kaydeder ve arama için sıraya alır.
4. Arama sağlayıcısı müşteriyi arar; yapay zekâ tur talebini ve rezervasyon bilgilerini toplar.
5. Sağlayıcı görüşme sonucunu Ejder AI'a bildirir. Görüşme özeti, sonuç ve alınan rezervasyon bilgileri kaydedilir.
6. Sonuç TurTakip'e aktarılır ve mevcut admin rezervasyon ekranında gösterilir.

## Önerilen entegrasyon sınırları

- `POST /api/webhooks/turtakip/leads`: Yeni lead bildirimi. TurTakip lead kimliği tekrarlanan bildirimlerin aynı lead'i tekrar oluşturmasını önler.
- `POST /api/webhooks/calls`: Görüşme sisteminden durum ve sonuç bildirimi için önerilen endpoint. Kesin sözleşme, son aşamada Verimor ve seçilecek sesli yapay zekâ altyapısı incelendikten sonra belirlenir.
- TurTakip tarafında sonuç kabul eden bir sunucu endpoint'i: Görüşme sonucunu ve varsa rezervasyon talebini mevcut veri modeline işler. Adresi ve alanları TurTakip deposu incelendikten sonra kesinleştirilir.

Gelen bildirimlerin kimliği doğrulanmalı; giden aktarımlar kalıcı olarak kaydedilmeli ve geçici hatalarda yeniden denenmelidir. Aynı görüşme sonucu tekrar geldiğinde ikinci rezervasyon oluşturulmamalıdır.

Uzun telefon görüşmesi bir HTTP isteğini açık tutarak yürütülmez. Arama başlatma ve sonuç alma ayrı işlemlerdir. Kalıcı veri deposu ve arama kuyruğu uygulama kurulumu sırasında seçilecektir.

## Veri ve durumlar

- Lead: TurTakip kimliği, ad, telefon, tur/form referansı, müşterinin ilettiği bilgiler, oluşturulma zamanı.
- Görüşme: Sağlayıcı görüşme kimliği, lead referansı, durum, başlangıç/bitiş zamanı, özet ve yapılandırılmış sonuç.
- Rezervasyon aktarımı: Görüşme referansı, toplanan rezervasyon alanları, aktarım durumu, TurTakip rezervasyon kimliği ve son hata.
- Önerilen arama durumları: bekliyor, sırada, aranıyor, tamamlandı, ulaşılamadı, başarısız.
- Önerilen aktarım durumları: bekliyor, aktarıldı, başarısız.

Görüşmenin tamamlanması tek başına rezervasyon onayı sayılmaz. Rezervasyonun taslak mı kesin kayıt mı olacağı TurTakip iş kurallarına göre belirlenecektir.

## Kurulumdan önce netleştirilecekler

1. Mevcut TurTakip deposu, form alanları, veri tabanı ve admin rezervasyon modeli.
2. Sesli yapay zekâ servisi; Verimor telefon bağlantısı son aşamada ele alınacak ve ilk uygulama kurulumu için ön koşul olmayacak.
3. Aramanın otomatik mi admin tarafından mı başlatılacağı.
4. Görüşme sonrası rezervasyonun onay/taslak davranışı.
5. Vercel proje bağlantısı ve gerekli ortam değişkenleri.

## TurTakip deposunda doğrulanan bağlantı noktaları

30 Eylül 2026 tarihinde https://github.com/resulersurer/Turtakipv2 deposu incelendi:

- Uygulama Next.js, Prisma ve mevcut bir rezervasyon servis katmanı kullanıyor.
- Formun `POST /api/tour-requests` endpoint'i `TourRequest` oluşturuyor. Şu an Ejder AI'a bildirim göndermiyor. Kalıcı bir aktarım işi bu kayıtla birlikte oluşturulmalı; Ejder AI'a ulaşılamaması formun kaybolmasına neden olmamalı.
- Lead alanları isim, telefon, e-posta, şehir, yetişkin/çocuk sayıları, tercih edilen tarih, bütçe, notlar, tur referansı ve kampanya kaynağını içeriyor.
- Mevcut `GET /api/integrations/lead-data`, `INTEGRATION_API_KEY` ile Bearer doğrulaması yapıyor. Gelecek tarihli yayınlanmış turları ve kesinleşmiş rezervasyonları döndürüyor; form lead'lerini sağlamıyor. Yeni form aktarımı için tek başına yeterli değil.
- `POST /api/reservations` admin oturumu gerektiriyor. Ejder AI dönüşü için ayrı, sunucudan sunucuya kimlik doğrulamalı bir endpoint tasarlanmalı ve mevcut `lib/reservations/service.ts` içindeki `createReservation` kullanılmalı.
- Rezervasyon servisi `requestId` ile tekrarları kontrol ediyor ve kontenjanı doğruluyor. Ejder AI her yeniden denemede aynı aktarım kimliğini kullanmalı.
- Rezervasyon oluşturmak için belirli bir tur kalkışı (`departureId`) ve yolcu listesi gerekiyor. Formdaki genel tur tercihi ve kişi sayısı tek başına yeterli değil; eksik bilgiler görüşmede alınmalı veya admin incelemesine bırakılmalı.
- Mevcut rezervasyon durumları `HOLD`, `CONFIRMED`, `CANCELLED`. `HOLD` süreli opsiyon anlamına geliyor; genel bir taslak yerine kullanılması iş kuralıyla kararlaştırılmalı.
- Sonucun gösterileceği mevcut ekran `/admin/reservations`; form talepleri ayrıca `/admin/tour-requests` altında yönetiliyor.

Telefon bağlantısı için Verimor seçildi. Kullanıcının isteğiyle bu bağlantı en son yapılacak. Sesli yapay zekâ servisi henüz seçilmedi; Verimor'un bu işlevi sağladığı varsayılmıyor.

## Uygulama sırası

1. Next.js uygulaması, veri modeli ve lead yönetim ekranı.
2. TurTakip form taleplerinin Ejder AI'a güvenilir aktarımı.
3. Görüşme sonucu, notlar ve rezervasyon aktarım akışının açıkça test verisi olarak işaretlenen kayıtlarla doğrulanması.
4. TurTakip admin rezervasyon ekranına sonuç aktarımı.
5. Sesli yapay zekâ altyapısı ve Verimor bağlantısı; gerçek telefon görüşmeleriyle uçtan uca doğrulama.

İlk aşamalarda gerçek arama yapılmayacak. Test görüşmeleri gerçek görüşmelerden ayırt edilecek ve canlı TurTakip rezervasyonlarına otomatik gönderilmeyecek.

## Mevcut durum

İlk aşama Next.js demo çalışma alanı olarak uygulandı. Güncel kurulum ve kapsam için kök dizindeki README.md dosyasına bakın. Yukarıdaki endpoint'ler uygulanmış API'ler değil, sonraki aşamanın tasarım önerileridir.
