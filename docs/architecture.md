# Frigora – Arayüz Mimarisi

Kapsam: yalnızca web arayüzü. Backend ayrı projedir; bu proje yalnızca REST sözleşmesini tüketir.

## Teknoloji
- Bootstrap 6 (`6.0.0-alpha.1`, sabit sürüm; alpha olduğu için güncelleme bilinçli yapılır). `npm install` ile gelir, `index.html` doğrudan `node_modules/bootstrap/dist` altından yükler.
- Derleme aracı yok: saf HTML + CSS + tarayıcı ES modülleri (vanilla JS). `npm start` yalnızca statik sunucu açar.
- History API router (temiz URL: `/login`, `/devices/:id`): sunucu bilinmeyen yolları `index.html`'e düşürmelidir (`serve -s`, nginx `try_files $uri /index.html`); varlık yolları köke göre mutlaktır
- CDN yok: çevrimdışı paketlenebilir
- Günlükleme: `@yigithsyn/logger` (import edilince `console.*` çıktısını renklendirir, zaman damgası ekler). Tarayıcıda yalın ad çözümü için `index.html` içinde import map vardır.
- Bootstrap 6 paketi ES modülüdür; `index.html` içinde `type="module"` ile yüklenir (klasik script hata verir).
- Not: ES modülleri `file://` ile çalışmaz; Electron/Capacitor içinde yerel http(s)/app protokolüyle servis edilir.

## Yapı
```
index.html       importmap, Bootstrap, üst çubuk + oturum rozeti
src/
  main.js        giriş noktası, rotalar, oturum rozeti
  config.js      apiBase, useMock, pollMs, sessionPollMs (window.FRIGORA_CONFIG ile ezilebilir)
  router.js      hash router; görünüm temizleme fonksiyonu döndürebilir
  session.js     periyodik /session yoklaması, durum yayını (onSessionChange)
  api/index.js   backend ile tek temas noktası (mock ↔ gerçek, credentials: include)
  api/mock.js    backend hazır olana kadar sahte veri ve sahte oturum çerezi
  views/         dashboard.js, device.js
docs/architecture.md
```

## Veri akışı
View → `api` → (mock | HTTP). Görünümler `fetch` çağırmaz. Canlı veri şimdilik `pollMs` ile polling; backend WebSocket sunarsa yalnızca `api` katmanı değişir.

## API sözleşmesi (backend ile mutabık kalınacak)
| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/devices` | `[{id, name, model, online, temp, alarm}]`; `model` "Marka Model" biçimindedir (Dixell, Eliwell, Carel...) |
| GET | `/devices/:id` | cihaz + `params: [{code, label, value, min, max}]`; `code` markaya özgüdür (Dixell `SP`/`HY`, Eliwell `SP`/`diF`, Carel `St`/`rd`) |
| PUT | `/devices/:id/params/:code` | gövde `{value}` |
| GET | `/session` | `{authenticated, user:{name, role}, expiresAt}`; oturum yoksa `401` |

## Oturum
`src/session.js` tüm rotalarda `sessionPollMs` (varsayılan 5 sn) aralığıyla `/session` isteği atar (sekme gizliyken durur, görününce hemen yoklar). Tüm API istekleri `credentials: 'include'` ile gider; çerez yönetimi (Set-Cookie, süre uzatma) sunucudadır. Durum (`active`, `anonymous`, `expired`, `offline`) üst çubuktaki rozette görünür; `onSessionChange` ile diğer modüller dinleyebilir. Her yoklamada oturum bilgisi `console.info`, hata/oturum bitişi `console.warn` ile günlüklenir. Mock modda `frigora_sid` çerezi üretilir ve her yoklamada 30 dakika uzatılır. Farklı alan adı kullanılırsa sunucu CORS'ta `Access-Control-Allow-Credentials: true` ve açık origin vermelidir.

## Taşınabilirlik
- Electron: proje klasörü yerel sunucu/protokol ile yüklenir.
- Android/iOS: Capacitor (WebView) ile aynı dosyalar.
- API adresi `window.FRIGORA_CONFIG` ile verilir (`config.js`).

## Sonraki adımlar
1. Giriş ekranı ve oturum bitince yönlendirme
2. Alarm listesi
3. Parametre doğrulama ve onay akışı
4. PWA (manifest, service worker)
5. Electron / Capacitor paketleme
