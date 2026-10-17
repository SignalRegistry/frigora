// History API router: "/devices/:id" gibi desenleri regex'e çevirir, :id değerini görünüme geçirir.
// Görünüm fonksiyonu (outlet, params) alır; isterse "temizlik" fonksiyonu döndürür (sayfadan çıkınca çağrılır).
// Temiz URL kullandığı için sunucu, bilinmeyen yolları index.html'e düşürmelidir (SPA fallback).
const routes = [];
let render = () => {};

export const route = (pattern, view) =>
  routes.push({ regex: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), view });

// Sayfa yenilemeden yola gider; aynı yoldaysa bir şey yapmaz.
export function navigate(path) {
  if (path === location.pathname) return;
  history.pushState(null, '', path);
  render();
}

export function start(outlet) {
  let stop = null;
  render = async () => {
    stop?.();
    stop = null;
    const path = location.pathname.replace(/(.)\/$/, '$1');
    for (const r of routes) {
      const m = path.match(r.regex);
      if (m) {
        stop = (await r.view(outlet, { ...m.groups })) ?? null;
        return;
      }
    }
    outlet.innerHTML = '<p class="text-body-secondary">Sayfa bulunamadı.</p>';
  };
  addEventListener('popstate', render);
  // Aynı kökene giden normal bağlantıları sayfa yenilemeden yönlendir
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    navigate(url.pathname);
  });
  render();
}
