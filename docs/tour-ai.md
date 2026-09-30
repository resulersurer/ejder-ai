# Tur & AI eşleştirme

`/tour-ai` sayfası TurTakip’te yayınlanmış ve gelecek kalkışı olan turları sunucudan çeker. Kullanıcı her tur için uluslararası formatta bir telefon numarası, AI danışmanı, tura özel konuşma talimatı ve aktiflik durumu seçer. Ayar `ejder_ai.tour_ai_configurations` tablosuna kaydedilir.

## Gerekli Vercel değişkenleri

- `TURTAKIP_API_URL`: TurTakip production adresi, örneğin `https://turtakipv2.vercel.app`.
- `TURTAKIP_INTEGRATION_KEY`: TurTakip projesindeki `INTEGRATION_API_KEY` ile aynı gizli değer.
- `ADMIN_ACCESS_KEY`: En az 16 karakterlik güçlü geçici yönetim anahtarı. Sayfadaki kayıt formunda istenir.
- `DATABASE_URL`: mevcut Neon bağlantısı.

Anahtarları Production, Preview ve gerekiyorsa Development ortamlarına ekleyin. Gizli değerleri Git’e, ekran görüntüsüne veya `NEXT_PUBLIC_` değişkenine koymayın. TurTakip anahtarı yalnızca Server Component ve Server Action içinden kullanılır.

Bu geçici yönetim anahtarı tam kullanıcı kimlik doğrulaması değildir. Gerçek ekip hesapları eklendiğinde `ADMIN_ACCESS_KEY` form alanı kaldırılıp kayıt işlemi oturum ve rol kontrolüyle korunmalıdır.

## Güvenlik ve veri bütünlüğü

Kaydetme işlemi formdaki tur kimliği, ad ve slug değerini yeniden canlı TurTakip listesinden doğrular. Telefon E.164 formatında olmalıdır. Her TurTakip turunun yalnızca bir eşleştirmesi olabilir; sonraki kayıt aynı satırı günceller. AI servis anahtarı veya Verimor kimliği henüz saklanmaz. `enabled` işareti bugün yalnızca yapılandırma durumudur; gerçek arama başlatmaz.
