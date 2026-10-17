import { api } from '../api/index.js';
import { refreshSession } from '../session.js';
import { navigate } from '../router.js';

// Giriş sayfası (/login): banner + form. Başarılı girişte oturumu yoklayıp panoya yönlendirir.
export async function login(outlet) {
  document.body.classList.add('login-page');
  outlet.innerHTML = `
    <div class="login-wrap">
      <div class="login-banner">
        <div>
          <h2>Soğuk zinciri <span class="accent">uzaktan</span> izleyin.</h2>
          <p>Dixell, Eliwell ve Carel kontrolörlerinizin sıcaklık, alarm ve parametrelerine tek yerden ulaşın.</p>
        </div>
      </div>
      <div class="login-panel">
        <form id="login-form" class="login-form" novalidate>
          <div class="login-head">
            <div class="login-logo"><img src="/assets/logo.svg" alt="" width="40" height="40" /></div>
            <div>
              <div class="login-title">Frigora</div>
              <small class="login-sub">Hesabınıza giriş yapın</small>
            </div>
          </div>
          <div id="login-error" class="login-error d-none" role="alert"></div>
          <div class="mb-3">
            <label class="form-label" for="username">Kullanıcı adı</label>
            <input class="form-control" id="username" name="username" autocomplete="username" required autofocus />
          </div>
          <div class="mb-4">
            <label class="form-label" for="password">Parola</label>
            <input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="btn btn-frigora w-100" type="submit">Giriş yap</button>
        </form>
      </div>
    </div>`;

  const form = outlet.querySelector('#login-form');
  const error = outlet.querySelector('#login-error');
  const button = form.querySelector('button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { username, password } = Object.fromEntries(new FormData(form));
    error.classList.add('d-none');
    if (!username.trim() || !password) {
      error.textContent = 'Kullanıcı adı ve parola gerekli.';
      error.classList.remove('d-none');
      return;
    }
    button.disabled = true;
    try {
      await api.login(username.trim(), password);
      await refreshSession();
      navigate('/');
    } catch (err) {
      error.textContent =
        err.status === 401 ? 'Kullanıcı adı veya parola hatalı.' : 'Sunucuya ulaşılamadı.';
      error.classList.remove('d-none');
      button.disabled = false;
    }
  });

  return () => document.body.classList.remove('login-page');
}
