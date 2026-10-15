/* ===================== INICIALIZAÇÃO GERAL ===================== */

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    showApp();
  } else {
    showLogin();
  }
  initA11yZoom();
});

/* ===================== SAUDAÇÃO ===================== */
function updateGreeting() {
  const greeting = document.getElementById('greetingMessage');
  if (!greeting) return;

  const hour = new Date().getHours();
  const message = hour >= 5 && hour < 12
    ? 'Bom dia!'
    : hour >= 12 && hour < 18
      ? 'Boa tarde!'
      : 'Boa noite!';

  greeting.textContent = `${message} Seja bem-vindo(a)!`;
}

updateGreeting();
setInterval(updateGreeting, 60000);

/* ===================== ACESSIBILIDADE - ZOOM DO CALENDÁRIO ===================== */
const A11Y_KEY = 'agendamentos_a11y_level';
const A11Y_MAX_LEVEL = 2;

function initA11yZoom() {
  const wrapper = document.querySelector('.calendar-wrapper');
  const decreaseBtn = document.getElementById('a11yDecreaseBtn');
  const increaseBtn = document.getElementById('a11yIncreaseBtn');
  let level = parseInt(localStorage.getItem(A11Y_KEY), 10) || 0;

  function applyLevel() {
    wrapper.classList.remove('a11y-1', 'a11y-2');
    if (level > 0) wrapper.classList.add(`a11y-${level}`);
    localStorage.setItem(A11Y_KEY, String(level));
  }

  decreaseBtn.addEventListener('click', () => {
    level = Math.max(0, level - 1);
    applyLevel();
  });

  increaseBtn.addEventListener('click', () => {
    level = Math.min(A11Y_MAX_LEVEL, level + 1);
    applyLevel();
  });

  applyLevel();
}
