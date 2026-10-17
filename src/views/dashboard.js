import { api } from '../api/index.js';
import { config } from '../config.js';

const card = (d) => `
  <div class="col-12 col-sm-6 col-lg-4">
    <a href="/devices/${d.id}" class="card text-decoration-none h-100">
      <div class="card-body d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-semibold">${d.name}</div>
          <small class="text-body-secondary">${d.model}</small>
          ${d.alarm ? `<div class="text-danger small">${d.alarm}</div>` : ''}
        </div>
        <div class="fs-3">${d.online ? `${d.temp} °C` : '<span class="badge text-bg-secondary">Çevrimdışı</span>'}</div>
      </div>
    </a>
  </div>`;

// Pano sayfası (/): cihaz kartları. config.pollMs aralığıyla yenilenir.
// Dönen fonksiyon router tarafından sayfadan çıkılınca çağrılır (zamanlayıcıyı durdurur).
export async function dashboard(outlet) {
  const load = async () => {
    const devices = await api.listDevices();
    outlet.innerHTML = `<div class="row g-3">${devices.map(card).join('')}</div>`;
  };
  await load();
  const timer = setInterval(load, config.pollMs);
  return () => clearInterval(timer);
}
