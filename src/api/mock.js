// SAHTE BACKEND: api/index.js'teki gerçek istemciyle aynı fonksiyon adlarını ve veri şeklini taşır
// (sözleşme: docs/architecture.md). Veri bellekte durur, sayfa yenilenince sıfırlanır.
// Cihaz: model = "Marka Model" (Dixell, Eliwell, Carel...). params = düzenlenebilir parametreler;
// kodlar markaya göre değişir (Dixell SP/HY, Eliwell SP/diF, Carel St/rd).
const devices = [
  {
    id: 'xrvh60-1', name: 'Süt Dolabı', model: 'Dixell XRVH60', online: true, temp: 3.4,
    alarm: null, params: [
      { code: 'SP', label: 'Set noktası (°C)', value: 3, min: -50, max: 50 },
      { code: 'HY', label: 'Diferansiyel (°C)', value: 2, min: 0.1, max: 25 },
    ],
  },
  {
    id: 'ewplus974-1', name: 'Dondurucu 1', model: 'Eliwell EWPlus 974', online: true, temp: -16.2,
    alarm: 'Yüksek sıcaklık', params: [
      { code: 'SP', label: 'Set noktası (°C)', value: -20, min: -50, max: 50 },
      { code: 'diF', label: 'Diferansiyel (°C)', value: 2, min: 0.1, max: 30 },
    ],
  },
  {
    id: 'ir33-1', name: 'Reyon 2', model: 'Carel IR33', online: true, temp: 4.1,
    alarm: null, params: [
      { code: 'St', label: 'Set noktası (°C)', value: 4, min: -50, max: 90 },
      { code: 'rd', label: 'Diferansiyel (°C)', value: 2, min: 0.1, max: 20 },
    ],
  },
  {
    id: 'xrvh60-3', name: 'Reyon 3', model: 'Dixell XRVH60', online: false, temp: null,
    alarm: null, params: [],
  },
  {
    id: 'ewplus974-2', name: 'Hazırlık Odası', model: 'Eliwell EWPlus 974', online: false, temp: null,
    alarm: null, params: [],
  },
];

// Sunucu davranışı taklidi: oturum çerezi yoksa oluşturur, her istekte süreyi uzatır.
const SESSION_TTL_S = 30 * 60;

const MOCK_USER = { username: 'demo', password: 'demo' };
const readSid = () => document.cookie.match(/(?:^|; )frigora_sid=([^;]*)/)?.[1];

export async function login(username, password) {
  if (username !== MOCK_USER.username || password !== MOCK_USER.password) {
    const err = new Error('API 401');
    err.status = 401;
    await delay(null);
    throw err;
  }
  document.cookie = `frigora_sid=${crypto.randomUUID()}; max-age=${SESSION_TTL_S}; path=/; SameSite=Lax`;
  return delay({ ok: true });
}

export async function logout() {
  document.cookie = 'frigora_sid=; max-age=0; path=/; SameSite=Lax';
  return delay({ ok: true });
}

export async function getSession() {
  const sid = readSid();
  if (!sid) return delay({ authenticated: false });
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
