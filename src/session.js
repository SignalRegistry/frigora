// Oturum yöneticisi: /session'ı periyodik yoklar, durumu (unknown|active|anonymous|expired|offline)
// dinleyicilere yayar. Çerezi sunucu yönetir; tarayıcı istekle birlikte gönderir/yeniler.
import '@yigithsyn/logger'; // console.* çıktısını renklendirir ve zaman damgası ekler
import { api } from './api/index.js';
import { config } from './config.js';

let state = { status: 'unknown', session: null };
const listeners = new Set();

export const getState = () => state;

// Dinleyici eklenince hemen mevcut durumla çağrılır; dönen fonksiyon aboneliği iptal eder.
export function onSessionChange(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

function set(next) {
  state = next;
  listeners.forEach((fn) => fn(state));
}

// Tek seferlik yoklama; sonucu state'e yazar ve loglar.
async function check() {
  try {
    const session = await api.getSession();
    console.info('Session:', JSON.stringify(session));
    set({ status: session.authenticated ? 'active' : 'anonymous', session });
  } catch (err) {
    // 401/403: oturum sona erdi; diğer hatalar: sunucuya ulaşılamıyor
    const status = err.status === 401 || err.status === 403 ? 'expired' : 'offline';
    console.warn(`Session ${status}:`, err.message);
    set({ status, session: null });
  }
}

// main.js'ten bir kez çağrılır. Sekme gizliyken yoklamayı atlar, görünür olunca hemen yoklar.
export function startSession() {
  check();
  setInterval(() => {
    if (!document.hidden) check();
  }, config.sessionPollMs);
  document.addEventListener('visibilitychange', () => !document.hidden && check());
}
