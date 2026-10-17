import { api } from '../api/index.js';

// Cihaz detay sayfası (#/devices/:id): cihaz bilgisi + parametre formu.
// Çevrimdışı cihazda form devre dışıdır; Kaydet yalnızca değişen parametreleri API'ye yazar.
export async function device(outlet, { id }) {
  const d = await api.getDevice(id);
  outlet.innerHTML = `
    <a href="#/" class="d-inline-block mb-3">&larr; Cihazlar</a>
    <h1 class="h4">${d.name}</h1>
    <p class="text-body-secondary">${d.model} · ${d.online ? `${d.temp} °C` : 'Çevrimdışı'}</p>
    <form id="params" class="vstack gap-3">
      ${d.params
        .map(
          (p) => `
        <div>
          <label class="form-label" for="p-${p.code}">${p.label}</label>
          <input class="form-control" id="p-${p.code}" name="${p.code}" type="number"
                 step="0.1" min="${p.min}" max="${p.max}" value="${p.value}" ${d.online ? '' : 'disabled'} />
        </div>`,
        )
        .join('')}
      ${d.params.length && d.online ? '<button class="btn btn-primary">Kaydet</button>' : ''}
      <div id="msg" class="small"></div>
    </form>`;

  outlet.querySelector('#params').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = outlet.querySelector('#msg');
    try {
      for (const p of d.params) {
        const value = Number(e.target.elements[p.code].value);
        if (value !== p.value) await api.updateParam(id, p.code, value);
      }
      msg.className = 'small text-success';
      msg.textContent = 'Kaydedildi.';
    } catch (err) {
      msg.className = 'small text-danger';
      msg.textContent = err.message;
    }
  });
}
