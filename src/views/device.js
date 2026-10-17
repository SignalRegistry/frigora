import { api } from '../api/index.js';

// Cihaz detay sayfası (/devices/:id): cihaz bilgisi + parametre formu.
// Çevrimdışı cihazda form devre dışıdır; Kaydet yalnızca değişen parametreleri API'ye yazar.
export async function device(outlet, { id }) {
  const d = await api.getDevice(id);
  outlet.innerHTML = `
    <div class="device-page">
      <a href="/" class="back-link"><span aria-hidden="true">←</span> Cihazlara dön</a>
      <div class="row g-4 align-items-start">
        <div class="col-12 lg:col-4">
          <section class="card card-subtle device-summary">
            <div class="card-body">
              <span class="device-state ${d.online ? 'is-online' : 'is-offline'}">
                <span class="state-dot" aria-hidden="true"></span>
                ${d.online ? 'Çevrimiçi' : 'Çevrimdışı'}
              </span>
              <div>
                <h1>${d.name}</h1>
                <p class="device-model">${d.model}</p>
              </div>
              <div class="summary-temperature ${d.online ? '' : 'fg-2'}">
                ${d.online ? `${d.temp} <span>°C</span>` : '—'}
              </div>
              <span class="summary-caption">Anlık sıcaklık</span>
              ${d.alarm ? `<div class="device-alarm"><span aria-hidden="true">!</span>${d.alarm}</div>` : ''}
            </div>
          </section>
        </div>
        <div class="col-12 lg:col-8">
          <section class="card card-subtle params-card">
            <div class="card-header">
              <div>
                <h2>Cihaz parametreleri</h2>
                <p>Kontrolör ayarlarını buradan güncelleyebilirsiniz.</p>
              </div>
            </div>
            <form id="params" class="card-body">
              ${
                d.params.length
                  ? d.params
                      .map(
                        (p) => `
                <div class="param-field">
                  <label class="form-label" for="p-${p.code}">${p.label}</label>
                  <input class="form-control" id="p-${p.code}" name="${p.code}" type="number"
                         step="0.1" min="${p.min}" max="${p.max}" value="${p.value}" ${d.online ? '' : 'disabled'} />
                </div>`,
                      )
                      .join('')
                  : '<p class="empty-params">Bu cihaz için düzenlenebilir parametre bulunmuyor.</p>'
              }
              ${d.params.length && d.online ? '<button class="btn-solid theme-primary" type="submit">Değişiklikleri kaydet</button>' : ''}
              <div id="msg" class="save-message" role="status" aria-live="polite"></div>
            </form>
          </section>
        </div>
      </div>
    </div>`;

  outlet.querySelector('#params').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = outlet.querySelector('#msg');
    try {
      for (const p of d.params) {
        const value = Number(e.target.elements[p.code].value);
        if (value !== p.value) await api.updateParam(id, p.code, value);
      }
      msg.className = 'small fg-success';
      msg.textContent = 'Kaydedildi.';
    } catch (err) {
      msg.className = 'small fg-danger';
      msg.textContent = err.message;
    }
  });
}
