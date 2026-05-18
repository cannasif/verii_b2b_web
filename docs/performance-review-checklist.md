# WMS Web Performance Review Checklist

## Ilk Yuk Kontrolu
- `Network` tabinda hard reload yap.
- Ilk HTML cevabindan sonra yuklenen JS chunk sayisini kontrol et.
- `vendor-3d`, `vendor-barcode`, `vendor-export` ilk sayfada geliyorsa nedenini incele.
- Ilk rota `access-control`, `barcode-designer`, `3d-warehouse` degilse bu feature chunk'lari yuklenmemeli.

## Route Lazy Kontrolu
- `dashboard` acilisinda sadece app shell ve ortak vendor chunk'lari yuklenmeli.
- `mail-settings`, `hangfire-monitoring`, `user-management`, `permission-groups` sayfalarina tek tek gidip ilgili namespace ve route chunk'larinin o anda geldigini dogrula.
- `3d-warehouse` sayfasina gitmeden `vendor-3d` chunk'inin yuklenmedigini kontrol et.
- `barcode-designer` sayfasina gitmeden `vendor-barcode` chunk'inin yuklenmedigini kontrol et.

## Action-Time Lazy Kontrolu
- `Barcode Designer` ekraninda sayfa ilk acilista `jspdf` chunk'i gelmemeli.
- `PDF` veya `Uyum Raporu PDF` aksiyonu tetiklenince `vendor-export` chunk'inin o anda geldigi gorulmeli.
- Grid export kullanilmadan `xlsx/jspdf` kaynakli ek istek olmamali.

## I18n Kontrolu
- Uygulama ilk acilista sadece `common/translation` ile gelmeli.
- `access-control`, `user-management`, `mail-settings`, `hangfire-monitoring` namespace chunk'lari sadece ilgili rota acildiginda yuklenmeli.
- Dil degistirince ilgili route namespace'i yeniden yukleniyor mu kontrol et.

## Runtime Config Kontrolu
- Development ortaminda `config.json` yoksa uygulama `VITE_API_URL` veya localhost origin ile devam etmeli.
- Development ortaminda eski cache nedeniyle farkli bir prod API'ye gitmemeli.
- Production ortaminda `config.json` fetch'i session cache ile tekrar kullanilmali.
- `Application > Session Storage` altinda `wms-runtime-config:v1` kaydini dogrula.

## App Shell Kontrolu
- Navbar ve sidebar ilk render'i bloklamamali.
- Notification dropdown acilmadan bildirim listesi cagrisi atilmamali.
- Bildirim hub baglantisi gereksiz yere acilis aninda degil, ihtiyac dogdugunda veya ilgili akista baglanmali.

## Performance Panel
- `Performance` kaydinda `route:*:render` measure kayitlarini ara.
- Route degisimlerinde olusan mark/measure'lar ile rota bazli render suresini karsilastir.
- Uzun task gorulurse ilgili route chunk ve agir effect'leri incele.

## Image Kontrolu
- Login ve shell logo gorsellerinin `decoding=async` ile geldigi dogrulanmali.
- Buyuk gorsellerin layout shift yaratmadigini `Performance Insights` veya `Lighthouse` ile kontrol et.

## Hedeflenen Sonuc
- Dashboard ilk acilisi daha erken gorunsun.
- Agir feature'lar sadece kullanildiginda yuklensin.
- Dev ortam yanlis API'ye cache yuzunden kaymasin.
- Route bazli render suresi sayisal olarak gozlenebilir olsun.
