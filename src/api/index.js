import { config } from '../config.js';
import * as mock from './mock.js';

// Arayüzün backend ile konuştuğu tek nokta. Sözleşme: docs/architecture.md
// Mock <-> gerçek geçişi config.useMock ile yapılır. Görünümler yalnızca `api`yi kullanır, fetch çağırmaz.
// 401/403 hatasında fırlatılan hatada err.status dolu olur (session.js buna bakar).
// Mock <-> gerçek geçişi config.useMock ile yapılır. Görünümler yalnızca `api`yi kullanır, fetch çağırmaz.
// 401/403 hatasında fırlatılan hatada err.status dolu olur (session.js buna bakar).
async function http(path, options = {}) {
  const res = await fetch(config.apiBase + path, {
    credentials: 'include', // oturum çerezi her istekle gider/yenilenir
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const real = {
  getSession: () => http('/session'),
  listDevices: () => http('/devices'),
  getDevice: (id) => http(`/devices/${id}`),
  updateParam: (id, code, value) =>
    http(`/devices/${id}/params/${code}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};

export const api = config.useMock ? mock : real;
