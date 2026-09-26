/* ===================== AUTENTICAÇÃO ===================== */
/* Login simples local (sem backend). Credenciais fixas conforme solicitado. */

const AUTH_KEY = 'agendamentos_auth';
const VALID_USER = 'jwds';
const VALID_PASS = '2004jw';

const Auth = {
  isLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  },
  login(user, pass) {
    if (user === VALID_USER && pass === VALID_PASS) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  },
  logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }
};

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  if (Auth.login(user, pass)) {
    errorEl.textContent = '';
    showApp();
  } else {
    errorEl.textContent = 'Usuário ou senha inválidos.';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  Auth.logout();
  if (document.getElementById('loginScreen')) {
    showLogin();
  } else {
    window.location.href = 'index.html';
  }
});

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('loginForm').reset();
  CalendarApp.init();
}

function showLogin() {
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}
