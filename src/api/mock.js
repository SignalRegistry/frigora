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

// Kayıt tutanakları: en yeni başta. Demo için sabit bir şablondan, geçmişe dönük zamanlarla üretilir.
const recordTemplates = [
  ['alarm', 'ewplus974-1', 'Yüksek sıcaklık alarmı başladı (-16.2 °C)'],
  ['param', 'xrvh60-1', 'SP değeri 4 → 3 olarak değiştirildi'],
  ['connection', 'xrvh60-3', 'Cihaz çevrimdışı oldu'],
  ['alarm', 'ir33-1', 'Yüksek sıcaklık alarmı sona erdi (4.8 °C)'],
  ['connection', 'ewplus974-2', 'Cihaz çevrimdışı oldu'],
  ['param', 'ewplus974-1', 'diF değeri 3 → 2 olarak değiştirildi'],
  ['connection', 'ir33-1', 'Cihaz çevrimiçi oldu'],
  ['alarm', 'xrvh60-1', 'Düşük sıcaklık alarmı başladı (0.8 °C)'],
  ['param', 'ir33-1', 'St değeri 5 → 4 olarak değiştirildi'],
  ['alarm', 'xrvh60-1', 'Düşük sıcaklık alarmı sona erdi (2.9 °C)'],
  ['connection', 'xrvh60-1', 'Cihaz çevrimiçi oldu'],
  ['param', 'ewplus974-1', 'SP değeri -18 → -20 olarak değiştirildi'],
];
const users = ['Demo Kullanıcı', 'Sistem'];
const records = recordTemplates.map(([type, deviceId, message], i) => {
  const d = devices.find((x) => x.id === deviceId);
  return {
    id: `rec-${i + 1}`,
    time: new Date(Date.now() - (i * 95 + 12) * 60 * 1000).toISOString(),
    type,
    deviceId,
    deviceName: d.name,
    message,
    user: type === 'param' ? users[0] : users[1],
  };
});

export const listRecords = () => delay(records);

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
