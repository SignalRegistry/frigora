// SAHTE BACKEND: api/index.js'teki gerçek istemciyle aynı fonksiyon adlarını ve veri şeklini taşır
// (sözleşme: docs/architecture.md). Veri bellekte durur, sayfa yenilenince sıfırlanır.
// Cihaz: params = düzenlenebilir parametreler (Dixell kodları: SP set noktası, HY diferansiyel).
const devices = [
  {
    id: 'xrvh60-1', name: 'Süt Dolabı', model: 'Dixell XRVH60', online: true, temp: 3.4,
    alarm: null, params: [
      { code: 'SP', label: 'Set noktası (°C)', value: 3, min: -50, max: 50 },
      { code: 'HY', label: 'Diferansiyel (°C)', value: 2, min: 0.1, max: 25 },
    ],
  },
  {
    id: 'xrvh60-2', name: 'Dondurucu 1', model: 'Dixell XRVH60', online: true, temp: -16.2,
    alarm: 'Yüksek sıcaklık', params: [
      { code: 'SP', label: 'Set noktası (°C)', value: -20, min: -50, max: 50 },
      { code: 'HY', label: 'Diferansiyel (°C)', value: 2, min: 0.1, max: 25 },
    ],
  },
  {
    id: 'xrvh60-3', name: 'Reyon 3', model: 'Dixell XRVH60', online: false, temp: null,
    alarm: null, params: [],
  },
];

// Sunucu davranışı taklidi: oturum çerezi yoksa oluşturur, her istekte süreyi uzatır.
const SESSION_TTL_S = 30 * 60;

export async function getSession() {
  const m = document.cookie.match(/(?:^|; )frigora_sid=([^;]*)/);
  const sid = m ? m[1] : crypto.randomUUID();
  document.cookie = `frigora_sid=${sid}; max-age=${SESSION_TTL_S}; path=/; SameSite=Lax`;
  return delay({
    authenticated: true,
    user: { name: 'Demo Kullanıcı', role: 'admin' },
    expiresAt: new Date(Date.now() + SESSION_TTL_S * 1000).toISOString(),
  });
}

// Gerçek ağ gecikmesini taklit eder; değerin kopyasını döndürür (çağıran mock verisini bozamasın).
const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 150));

export const listDevices = () => delay(devices);

export async function getDevice(id) {
  const d = devices.find((x) => x.id === id);
  if (!d) throw new Error('Cihaz bulunamadı');
  return delay(d);
}

export async function updateParam(id, code, value) {
  const p = devices.find((x) => x.id === id)?.params.find((x) => x.code === code);
  if (!p) throw new Error('Parametre bulunamadı');
  p.value = value;
  return delay(p);
}
