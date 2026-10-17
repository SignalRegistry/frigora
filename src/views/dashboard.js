import { api } from '../api/index.js';
import { config } from '../config.js';

const icons = {
  devices: '<path d="M3 4.5h10v9H3zM6 2.5h4M6 15.5h4M6 7h4M6 10h4"/>',
  online: '<path d="M2.5 6.5a8 8 0 0 1 11 0M5 9a4.5 4.5 0 0 1 6 0m-4 2.5a1.5 1.5 0 0 1 2 0M8 14.5v.1"/>',
  alarms: '<path d="M12.5 10.5c0 1.2 1 2 1 2h-11s1-.8 1-2V7a4 4 0 1 1 8 0zM6.5 14.5a1.6 1.6 0 0 0 3 0"/>',
};

const stat = (label, value, icon, theme) => `
  <div class="col-12 sm:col-6 lg:col-4">
    <article class="card card-subtle stat-card">
      <div class="card-body">
        <span class="stat-icon theme-${theme}" aria-hidden="true">
          <svg viewBox="0 0 16 16">${icons[icon]}</svg>
        </span>
        <div class="stat-copy">
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value}</div>
        </div>
      </div>
    </article>
  </div>`;

const card = (d) => `
  <div class="col-12 md:col-6 xl:col-4">
    <a href="/devices/${d.id}" class="card card-subtle device-card text-decoration-none h-100">
      <div class="card-body">
        <div class="device-card-top">
          <span class="device-state ${d.online ? 'is-online' : 'is-offline'}">
            <span class="state-dot" aria-hidden="true"></span>
            ${d.online ? 'Çevrimiçi' : 'Çevrimdışı'}
          </span>
          <span class="device-arrow" aria-hidden="true">↗</span>
        </div>
        <div class="device-card-main">
          <div class="device-name">${d.name}</div>
          <div class="device-model">${d.model}</div>
          ${d.alarm ? `<div class="device-alarm"><span aria-hidden="true">!</span>${d.alarm}</div>` : ''}
        </div>
        <div class="device-temperature ${d.online ? '' : 'fg-2'}">
          ${d.online ? `${d.temp} <span>°C</span>` : '—'}
        </div>
      </div>
    </a>
  </div>`;

// Pano sayfası (/): cihaz kartları. config.pollMs aralığıyla yenilenir.
// Dönen fonksiyon router tarafından sayfadan çıkılınca çağrılır (zamanlayıcıyı durdurur).
export async function dashboard(outlet) {
  const load = async () => {
    const devices = await api.listDevices();
    const online = devices.filter((d) => d.online).length;
    const alarms = devices.filter((d) => d.alarm).length;

    outlet.innerHTML = `
      <section class="dashboard-heading">
        <div>
          <div class="page-eyebrow">FRIGORA · SOĞUK ZİNCİR YÖNETİMİ</div>
          <h1>Genel Bakış</h1>
          <p>Sisteminizi ve cihazlarınızı tek bir yerden takip edin.</p>
        </div>
        <div class="live-indicator"><span class="state-dot" aria-hidden="true"></span>Canlı izleme</div>
      </section>
      <section class="row g-3 dashboard-stats" aria-label="Sistem özeti">
        ${stat('Toplam cihaz', devices.length, 'devices', 'primary')}
        ${stat('Çevrimiçi', online, 'online', 'success')}
        ${stat('Aktif alarm', alarms, 'alarms', alarms ? 'danger' : 'secondary')}
      </section>
      <section class="device-section">
        <div class="section-heading">
          <div>
            <h2>Cihazlar</h2>
            <p>Kontrolörlerinizin anlık durumu ve ölçümleri</p>
          </div>
          <span class="badge badge-subtle theme-secondary">${devices.length} cihaz</span>
        </div>
        <div class="row g-3">${devices.map(card).join('')}</div>
      </section>`;
  };
  await load();
  const timer = setInterval(load, config.pollMs);
  return () => clearInterval(timer);
}
