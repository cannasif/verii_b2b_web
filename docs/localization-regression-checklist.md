# B2B Lokalizasyon Regression Checklist

Bu doküman, dil bazlı arayüz kontrollerini sistematik olarak test etmek için kullanılacak standart listedir. Amaç: yeni anahtar/özellik eklerken tek tek ekranlarda çeviri kırılmalarını kaçırmamak.

## Hedef ve Kapsam
- Tüm desteklenen diller: `tr, en, de, fr, ar, es, it`.
- Kontrol kapsamı: Ortak UI metinleri (`common`), `access-control` namespace’i ve tüm B2B ekranları.
- Amaç: Anahtar eksikliği, yanlış namespace fallback, dil değişiminden sonra kalan hardcoded veya okunaksız etiketleri yakalamak.

## 0) Hızlı Otomasyon Adımları
1. `verii_b2b_web` dizininde i18n dosya yapısı kontrol edilir.
   - Beklenen klasörler: `src/locales/{tr,en,de,fr,ar,es,it}/common.json`.
   - Access control namespace: `src/features/access-control/localization/{tr,en,de,fr,es,it,ar}.json`.
2. Temel key-parite kontrolü (en baseline ile kıyas):
   ```bash
   node - <<'NODE'
   const fs = require('fs');
   const path = require('path');

   const flatten = (obj, prefix = '', out = {}) => {
     for (const [key, value] of Object.entries(obj || {})) {
       const next = prefix ? `${prefix}.${key}` : key;
       if (value && typeof value === 'object' && !Array.isArray(value)) {
         flatten(value, next, out);
       } else {
         out[next] = true;
       }
     }
     return out;
   };

   const dumpMissing = (baseLang, compareLangs, root) => {
     const base = flatten(JSON.parse(fs.readFileSync(path.join(root, baseLang, 'common.json'))));
     for (const lang of compareLangs) {
       const file = path.join(root, lang, 'common.json');
       if (!fs.existsSync(file)) {
         console.log(`${lang}: common.json bulunamadi`);
         continue;
       }
       const current = flatten(JSON.parse(fs.readFileSync(file)));
       const missing = Object.keys(base).filter((k) => !current[k]);
       const extra = Object.keys(current).filter((k) => !base[k]);
       console.log(`${lang}: missing=${missing.length}, extra=${extra.length}`);
       if (missing.length) {
         console.log(`  - eksik örnek (ilk 20): ${missing.slice(0, 20).join(', ')}`);
       }
     }
   };

   dumpMissing('en', ['tr', 'de', 'fr', 'ar', 'es', 'it'], 'src/locales');
   NODE
   ```
3. Feature namespace kontrolü:
   ```bash
   node - <<'NODE'
   const fs = require('fs');
   const path = require('path');
   const flat = (obj, p = '', out = {}) => {
     for (const k of Object.keys(obj || {})) {
       const nk = p ? `${p}.${k}` : k;
       const v = obj[k];
       if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, nk, out);
       else out[nk] = true;
     }
     return out;
   };
   const root = 'src/features/access-control/localization';
   const base = flat(JSON.parse(fs.readFileSync(path.join(root, 'en.json'))));
   for (const lang of ['tr', 'de', 'fr', 'es', 'it', 'ar']) {
   const curr = flat(JSON.parse(fs.readFileSync(path.join(root, `${lang}.json`))));
     const missing = Object.keys(base).filter((k) => !curr[k]);
     const extra = Object.keys(curr).filter((k) => !base[k]);
     console.log(`${lang}: missing=${missing.length}, extra=${extra.length}`);
     if (missing.length) console.log(`  - eksik örnek: ${missing.slice(0, 16).join(', ')}`);
   }
   NODE
   ```

## 1) Ekran Bazlı Regression (Manual)

- [ ] Dil anahtarı değişiminde sidebar/header metinleri tamamen çevriliyor.
- [ ] Dil değiştiğinde route geçişlerinde fallback text (`translation missing`, key adı gibi) görmüyoruz.
- [ ] Türkçe olmayan dilde test edildiğinde sayfa başlıkları ve boş ekran metinleri anlaşılır.
- [ ] Sayfa içi toast, empty state, hata mesajı ve onay metinleri ilgili dilde.

### 1.1 Giriş ve Kimlik Doğrulama
- [ ] `/auth/admin-login`
- [ ] `/forgot-password`
- [ ] `/reset-password`

### 1.2 B2B Ana Ekranlar
- [ ] `/b2b/insights`
- [ ] `/b2b/companies`
- [ ] `/b2b/buyers`
- [ ] `/b2b/catalog`
- [ ] `/b2b/catalog/:id`
- [ ] `/b2b/catalog/:id/edit`
- [ ] `/b2b/product-matches`
- [ ] `/b2b/catalog-visibility`
- [ ] `/b2b/pricing`
- [ ] `/b2b/inventory`
- [ ] `/b2b/shopping-lists`
- [ ] `/b2b/approval-rules`
- [ ] `/b2b/quotes`
- [ ] `/b2b/orders`
- [ ] `/b2b/payments`
- [ ] `/b2b/payment-operations`
- [ ] `/b2b/marketplace-channels`
- [ ] `/b2b/marketplace-listings`
- [ ] `/b2b/marketplace-events`
- [ ] `/b2b/marketplace-settings`
- [ ] `/b2b/integrations`
- [ ] `/b2b/:workspaceKind/create`

### 1.3 Yönetim (Admin)
- [ ] `/users/mail-settings`
- [ ] `/hangfire-monitoring`
- [ ] `/trace-explorer`
- [ ] `/access-control/users`
- [ ] `/access-control/permission-definitions`
- [ ] `/access-control/permission-groups`
- [ ] `/access-control/user-group-assignments`
- [ ] `/access-control/wms-scope-policies`
- [ ] `/access-control/wms-scope-assignments`

## 2) Dil Kayması ve Bağlam Testleri
- [ ] `statusLabels.*` diller arası anlamlı ve tutarlı (waiting/approved/...)
- [ ] Sidebar item isimleri tamamı (B2B ve WMS karşılaştırmalı) eksiksiz.
- [ ] `languageNames.*` her dilde görünüyor.
- [ ] Sayı formatları, tarih formatları, para birimi formatları locale’e göre doğru.

## 3) Test Notu Şablonu
- **Dil:** `xx-XX`
- **Ekran:** `route-name`
- **Kontrol:** `hangi alan/etiket`
- **Durum:** `PASS / FAIL`
- **Not:** `eksik/yanlış metin, ekran görüntüsü, beklenen değer`

## 4) Bug-Tracking için Bulunan Mevcut Eksikler (Bu build için)

1) **`LanguageSwitcher` dili seçimi sınırlı**
- Şu an UI’de sadece `tr, en, de, fr` seçilebiliyor; `ar/es/it` JSON dosyaları olsa da seçenekte görünmüyor.
- Etki: gerçek kullanıcılar bu dillerde deneyimleyemiyor.

2) **`common` locale eksik anahtarlar**
- `en` ile karşılaştırıldığında `de/es/fr/ar/it` için yüksek sayıda eksik anahtar raporu var.
- Özellikle eski WMS tarafına ait `statusLabels`, `sidebar` ve bazı ortak alanların eksik olduğu görülüyor.

3) **`access-control` namespace eksik anahtarlar**
- `de/fr/es/it/ar` dosyalarında `wmsScopePolicy`, `wmsScopePolicies`, `wmsScopeAssignments` alanlarının bazı başlık/yardım metinleri eksik.
- Etki: yeni eklenen sayfalar dil değişiminde yarım metin veya fallback gösterebilir.

4) **Çok dilli kalite kontrolü**
- Bazı dillerde karışık dil kalıntıları (Türkçe/İngilizce) tespit edildi; içerik tutarlılığı tekrar gözden geçirilmeli.

## 5) CRM Localize Baseline Analizi
- CRM tarafındaki locale organizasyonu `src/locales/{lang}/*.json` + feature `localization/*.json` modelinde çalışıyor.
- `sync-locale-leaves-from-tr.mjs` ve `check-locale-consistency.mjs` ile key parity yaklaşımı kullanılabiliyor.
- B2B’de aynı strateji ile eksik anahtarlar otomatik doldurularak `en` baseline ile `de/fr/es/ar/it` paritesi tamamlandı.
- `LanguageSwitcher` tarafındaki dil listesi de CRM’deki destekli dil setine uygun olacak şekilde `tr/en/de/fr/ar/es/it` olarak güncellendi.
- B2B’de test sırasında `npm run build` başarılı, çeviri missing key uyarısı bırakmayacak şekilde `parseMissingKeyHandler` davranışı korunarak anahtar seti kapatıldı.

### Sonuç Raporu (tamamlanan test)
- `common` eksik anahtar: `de/es/fr/ar/it` için `0`
- `access-control` eksik anahtar: `de/es/fr/ar/it` için `0`

## 6) Sonraki Aşama (Öneri)
- Bu checklist her sprint sonunda CI benzeri bir adım olarak çalıştırılsın.
- Eksik anahtar sayacı `yapıdaki yeni key` eklenmeden önce commit’e girmemeli (öncesinde `pre-commit`/`pre-push` check listesine eklenebilir).
