import { api } from '../api/index.js';

const types = {
  alarm: ['danger', 'Alarm'],
  param: ['primary', 'Parametre'],
  connection: ['secondary', 'Bağlantı'],
};

const fmt = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const row = (r) => `
  <tr>
    <td class="text-nowrap">${fmt.format(new Date(r.time))}</td>
    <td><span class="badge badge-subtle theme-${types[r.type][0]}">${types[r.type][1]}</span></td>
    <td><a href="/devices/${esc(r.deviceId)}">${esc(r.deviceName)}</a></td>
    <td>${esc(r.message)}</td>
    <td class="fg-2 text-nowrap">${esc(r.user)}</td>
  </tr>`;

// Kayıt tutanakları sayfası (/records): olay listesi, türe göre süzülebilir.
export async function records(outlet) {
  const all = await api.listRecords();
  outlet.innerHTML = `
    <section class="dashboard-heading">
      <div>
        <div class="page-eyebrow">FRIGORA · OLAY GEÇMİŞİ</div>
        <h1>Kayıt Tutanakları</h1>
        <p>Alarmlar, parametre değişiklikleri ve bağlantı olayları.</p>
      </div>
    </section>
    <section class="records-section">
      <div class="records-filters" role="group" aria-label="Tür filtresi">
        <button type="button" class="btn-solid theme-primary btn-sm" data-type="">Tümü (${all.length})</button>
        ${Object.entries(types)
          .map(([k, [, label]]) => `<button type="button" class="btn-subtle theme-secondary btn-sm" data-type="${k}">${label} (${all.filter((r) => r.type === k).length})</button>`)
          .join('')}
      </div>
      <div class="table-responsive">
        <table class="table records-table">
          <thead><tr><th>Zaman</th><th>Tür</th><th>Cihaz</th><th>Açıklama</th><th>Kullanıcı</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>`;

  const body = outlet.querySelector('tbody');
  const buttons = outlet.querySelectorAll('[data-type]');
  const show = (type) => {
    body.innerHTML = all.filter((r) => !type || r.type === type).map(row).join('');
    buttons.forEach((b) => {
      const on = b.dataset.type === type;
      b.className = `${on ? 'btn-solid theme-primary' : 'btn-subtle theme-secondary'} btn-sm`;
    });
  };
  outlet.querySelector('.records-filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (b) show(b.dataset.type);
  });
  show('');
}
