import { api } from '../api/index.js';

const LIVE_SAMPLE_INTERVAL_MS = 5000;
const MAX_TEMPERATURE_SAMPLES = 18000;
let plotlyPromise;

function loadPlotly() {
  if (window.Plotly) return Promise.resolve(window.Plotly);
  if (!plotlyPromise) {
    plotlyPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/node_modules/plotly.js-dist/plotly.js';
      script.onload = () => resolve(window.Plotly);
      script.onerror = () => {
        script.remove();
        plotlyPromise = undefined;
        reject(new Error('Plotly kütüphanesi yüklenemedi.'));
      };
      document.head.append(script);
    });
  }
  return plotlyPromise;
}

async function drawTemperatureHistory(element, samples) {
  const Plotly = await loadPlotly();
  const styles = getComputedStyle(document.documentElement);
  const foreground = styles.getPropertyValue('--bs-fg-body').trim();
  const muted = styles.getPropertyValue('--bs-fg-2').trim();
  const grid = styles.getPropertyValue('--bs-border-color-translucent').trim();
  await Plotly.newPlot(
    element,
    [
      {
        type: 'scatter',
        mode: 'lines+markers',
        x: samples.map((sample) => sample.time),
        y: samples.map((sample) => sample.temperature),
        line: { color: styles.getPropertyValue('--bs-primary-bg').trim(), shape: 'spline', width: 2.5 },
        marker: { size: 5 },
        fill: 'tozeroy',
        fillcolor: 'rgba(87, 143, 255, 0.12)',
        hovertemplate: '%{x|%d.%m.%Y %H:%M}<br>%{y:.1f} °C<extra></extra>',
      },
    ],
    {
      autosize: true,
      margin: { t: 16, r: 20, b: 56, l: 56 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: foreground, family: getComputedStyle(document.body).fontFamily },
      hoverlabel: { bgcolor: styles.getPropertyValue('--bs-bg-1').trim(), font: { color: foreground } },
      xaxis: {
        title: { text: 'Zaman', font: { color: muted } },
        type: 'date',
        tickformat: '%H:%M<br>%d %b',
        gridcolor: grid,
        zerolinecolor: grid,
        tickfont: { color: muted },
      },
      yaxis: {
        title: { text: 'Sıcaklık (°C)', font: { color: muted } },
        gridcolor: grid,
        zerolinecolor: grid,
        tickfont: { color: muted },
      },
    },
    { responsive: true, displayModeBar: false },
  );
}

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
                ${d.online ? `<span id="summary-temperature-value">${d.temp}</span> <span>°C</span>` : '—'}
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
      <section class="card card-subtle temperature-history-card" aria-labelledby="temperature-history-title">
        <div class="card-header">
          <div>
            <h2 id="temperature-history-title">Prob sıcaklık geçmişi</h2>
            <p>${d.online ? 'Son 24 saatin ölçümleri · Canlı güncelleme 5 sn’de bir' : 'Son 24 saatteki ölçümler'}</p>
          </div>
        </div>
        <div class="card-body">
          <div id="temperature-chart" class="temperature-chart" aria-label="Zamana göre prob sıcaklığı grafiği" role="img" hidden></div>
          <p id="temperature-chart-message" class="chart-message" role="status" aria-live="polite">Sıcaklık geçmişi yükleniyor…</p>
        </div>
      </section>
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

  const chart = outlet.querySelector('#temperature-chart');
  const chartMessage = outlet.querySelector('#temperature-chart-message');
  let disposed = false;
  let liveUpdateTimer;
  const renderTemperatureHistory = async () => {
    try {
      const samples = await api.getDeviceTemperatureHistory(id);
      if (disposed) return;
      if (!samples.length) {
        chartMessage.textContent = 'Bu cihaz için sıcaklık geçmişi bulunmuyor.';
        return;
      }
      chart.hidden = false;
      chartMessage.hidden = true;
      await drawTemperatureHistory(chart, samples);
      if (disposed) {
        window.Plotly.purge(chart);
        return;
      }
      if (d.online) {
        const update = async () => {
          try {
            const sample = await api.getLatestDeviceTemperature(id);
            if (disposed) return;
            await window.Plotly.extendTraces(
              chart,
              { x: [[sample.time]], y: [[sample.temperature]] },
              [0],
              MAX_TEMPERATURE_SAMPLES,
            );
            outlet.querySelector('#summary-temperature-value').textContent = sample.temperature.toFixed(1);
            chartMessage.hidden = true;
          } catch (err) {
            if (!disposed) {
              chartMessage.textContent = `Canlı sıcaklık verisi alınamadı: ${err.message}`;
              chartMessage.hidden = false;
            }
          } finally {
            if (!disposed) liveUpdateTimer = setTimeout(update, LIVE_SAMPLE_INTERVAL_MS);
          }
        };
        liveUpdateTimer = setTimeout(update, LIVE_SAMPLE_INTERVAL_MS);
      }
    } catch (err) {
      if (!disposed) {
        chartMessage.textContent = `Sıcaklık geçmişi yüklenemedi: ${err.message}`;
        chartMessage.hidden = false;
      }
    }
  };
  renderTemperatureHistory();
  return () => {
    disposed = true;
    clearTimeout(liveUpdateTimer);
    if (chart.data && window.Plotly) window.Plotly.purge(chart);
  };
}
