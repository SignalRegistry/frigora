// Giriş noktası: oturum rozetini bağlar, oturum yoklamasını başlatır, rotaları kaydeder.
// Yeni sayfa eklemek için: views/ altına dosya aç, buraya route() satırı ekle.
import { route, start, navigate } from './router.js';
import { dashboard } from './views/dashboard.js';
import { device } from './views/device.js';
import { login } from './views/login.js';
import { records } from './views/records.js';

import { startSession, onSessionChange, refreshSession } from './session.js';
import { api } from './api/index.js';
import { config } from './config.js';

// Oturum durumu -> [Bootstrap rengi, rozet metni]
const labels = {
  unknown: ['secondary', '…'],
  active: ['success', 'Bağlı'],
  anonymous: ['warning', 'Giriş yok'],
  expired: ['danger', 'Oturum bitti'],
  offline: ['danger', 'Sunucu yok'],
};
const badge = document.getElementById('session-badge');
onSessionChange(({ status, session }) => {
  const [color, text] = labels[status];
  badge.className = `badge badge-subtle theme-${color}`;
  badge.textContent = text;
  const user = session?.user;
  document.getElementById('user-name').textContent = user?.name ?? 'Misafir';
  document.getElementById('user-fullname').textContent = user?.name ?? '—';
  document.getElementById('user-role').textContent = user?.role ?? '';
  document.getElementById('user-avatar').textContent = (user?.name ?? '?').trim().charAt(0).toUpperCase();
  // Oturum yoksa/bittiyse giriş sayfasına yönlendir
  if ((status === 'anonymous' || status === 'expired') && location.pathname !== '/login') {
    navigate('/login');
  }
});
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await api.logout();
  } catch (err) {
    console.warn('Logout failed:', err.message);
  }
  refreshSession();
});
startSession();

// Yan menü: açılırken cihaz listesini tazeler; bağlantıya tıklanınca kapanır.
const drawer = document.getElementById('side-drawer');
const sideDevices = document.getElementById('side-devices');
const loadSideDevices = async () => {
  try {
    const devices = await api.listDevices();
    sideDevices.innerHTML = devices.length
      ? devices
          .map(
            (d) => `<li><a class="side-device ${d.online ? 'is-online' : 'is-offline'}"             href="/devices/${d.id}">
              <span class="state-dot" aria-hidden="true"></span>
              <span class="side-device-text"><span class="side-device-name">${d.name}</span><small class="fg-2">${d.model}</small></span>
            </a></li>`,
          )
          .join('')
      : '<li class="fg-2 px-2">Cihaz yok.</li>';
  } catch (err) {
    sideDevices.innerHTML = '<li class="fg-2 px-2">Liste alınamadı.</li>';
  }
};
drawer.addEventListener('show.bs.drawer', loadSideDevices);
// Dar ekranda bağlantıya tıklanınca drawer kapanır (data-bs-dismiss bağlantıyı engelleyeceği için elle).
drawer.addEventListener('click', (e) => {
  if (!wide.matches && e.target.closest('a[href]')) drawer.querySelector('.btn-close').click();
});
loadSideDevices();
setInterval(loadSideDevices, config.pollMs);

// Geniş ekranda düğme kenar çubuğunu gizler/gösterir (tercih saklanır); dar ekranda Bootstrap drawer açılır.
const shell = document.querySelector('.app-shell');
const wide = matchMedia('(min-width: 1024px)');
const sideToggle = document.querySelector('.menu-toggle');
shell.classList.toggle('side-hidden', localStorage.getItem('side-hidden') === '1');
// Geniş ekranda Bootstrap'in drawer tetikleyicisi devre dışı kalır, aksi halde aynı tıklamayı o da işler.
const syncToggle = () => {
  if (wide.matches) sideToggle.removeAttribute('data-bs-toggle');
  else sideToggle.setAttribute('data-bs-toggle', 'drawer');
};
syncToggle();
wide.addEventListener('change', syncToggle);
sideToggle.addEventListener('click', () => {
  if (!wide.matches) return;
  const hidden = shell.classList.toggle('side-hidden');
  localStorage.setItem('side-hidden', hidden ? '1' : '0');
});

route('/records', records);

route('/login', login);
route('/', dashboard);
route('/devices/:id', device);
start(document.getElementById('app'));
