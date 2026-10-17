// Hash router: "/devices/:id" gibi desenleri regex'e çevirir, :id değerini görünüme geçirir.
// Görünüm fonksiyonu (outlet, params) alır; isterse "temizlik" fonksiyonu döndürür (sayfadan çıkınca çağrılır).
// Hash tabanlı olduğu için sunucuda yönlendirme ayarı gerekmez.
const routes = [];

export const route = (pattern, view) =>
  routes.push({ regex: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), view });

export function start(outlet) {
  let stop = null;
  const render = async () => {
    stop?.();
    stop = null;
    const path = location.hash.slice(1) || '/';
    for (const r of routes) {
      const m = path.match(r.regex);
      if (m) {
        stop = (await r.view(outlet, { ...m.groups })) ?? null;
        return;
      }
    }
    outlet.innerHTML = '<p class="text-body-secondary">Sayfa bulunamadı.</p>';
  };
  addEventListener('hashchange', render);
  render();
}
