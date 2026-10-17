// Tüm ayarlar burada. Ortama göre window.FRIGORA_CONFIG (index.html'den önce tanımlanırsa) ile ezilebilir.
// useMock: true  -> api/mock.js (backend yok); false -> apiBase adresindeki gerçek backend.
// pollMs: pano yenileme (ms); sessionPollMs: /session yoklama aralığı (ms).
export const config = {
  apiBase: '/api',
  useMock: true,
  pollMs: 5000,
  sessionPollMs: 5000,
  ...(window.FRIGORA_CONFIG ?? {}),
};
