// Giriş noktası: oturum rozetini bağlar, oturum yoklamasını başlatır, rotaları kaydeder.
// Yeni sayfa eklemek için: views/ altına dosya aç, buraya route() satırı ekle.
import { route, start } from './router.js';
import { dashboard } from './views/dashboard.js';
import { device } from './views/device.js';

import { startSession, onSessionChange } from './session.js';

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
  badge.className = `badge text-bg-${color}`;
  badge.textContent = session?.user ? `${session.user.name} · ${text}` : text;
});
startSession();

route('/', dashboard);
route('/devices/:id', device);
start(document.getElementById('app'));
