// Giriş noktası: oturum rozetini bağlar, oturum yoklamasını başlatır, rotaları kaydeder.
// Yeni sayfa eklemek için: views/ altına dosya aç, buraya route() satırı ekle.
import { route, start, navigate } from './router.js';
import { dashboard } from './views/dashboard.js';
import { device } from './views/device.js';
import { login } from './views/login.js';

import { startSession, onSessionChange, refreshSession } from './session.js';
import { api } from './api/index.js';

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

route('/login', login);
route('/', dashboard);
route('/devices/:id', device);
start(document.getElementById('app'));
