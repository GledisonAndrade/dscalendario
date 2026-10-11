if (!Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}

const speechCatalogBody = document.getElementById('speechCatalogBody');
const speechHistoryBody = document.getElementById('speechHistoryBody');
const upcomingSpeechesBody = document.getElementById('upcomingSpeechesBody');
const historySearch = document.getElementById('historySearch');
const upcomingCount = document.getElementById('upcomingCount');
const completedCount = document.getElementById('completedCount');

function escapeHistoryHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatHistoryDate(dateKey) {
  return dateKey ? dateKey.split('-').reverse().join('/') : '-';
}

function renderSpeechHistory() {
  const history = TalkHistoryStorage.getAll().sort((first, second) => second.date.localeCompare(first.date));
  const latestByNumber = new Map();
  history.forEach(entry => {
    if (entry.numero && !latestByNumber.has(String(entry.numero))) {
      latestByNumber.set(String(entry.numero), entry);
    }
  });

  const speeches = new Map(Esbocos.getAll().map(speech => [String(speech.numero), { ...speech }]));
  history.forEach(entry => {
    if (entry.numero && !speeches.has(String(entry.numero))) {
      speeches.set(String(entry.numero), { numero: String(entry.numero), tema: entry.tema || 'Tema não informado' });
    }
  });

  const term = historySearch.value.trim().toLowerCase();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const catalogEntries = Array.from(speeches.values())
    .sort((first, second) => Number(first.numero) - Number(second.numero))
    .filter(speech => {
      const last = latestByNumber.get(String(speech.numero));
      return !term || [speech.numero, speech.tema, last?.orador].some(value => String(value || '').toLowerCase().includes(term));
    });

  speechCatalogBody.innerHTML = catalogEntries.length
    ? catalogEntries.map(speech => {
      const last = latestByNumber.get(String(speech.numero));
      const availableDate = last ? AppointmentRules.addMonths(last.date, 5) : '';
      const status = !last
        ? 'Nunca realizado'
        : todayKey < availableDate
          ? `<span class="status-blocked">Bloqueado até ${formatHistoryDate(availableDate)}</span>`
          : `<span class="status-available">Disponível</span>`;
      return `<tr><td>${escapeHistoryHtml(speech.numero)}</td><td>${escapeHistoryHtml(speech.tema)}</td><td>${formatHistoryDate(last?.date)}</td><td>${escapeHistoryHtml(last?.orador || '-')}</td><td>${status}</td></tr>`;
    }).join('')
    : '<tr><td colspan="5" class="table-empty">Nenhum número encontrado.</td></tr>';

  const completedDates = new Set(history.map(entry => entry.date));
  const upcomingEntries = Object.entries(Storage.getAll())
    .filter(([date, appointment]) => date >= todayKey && !appointment.realizadoEm && !completedDates.has(date))
    .map(([date, appointment]) => ({ date, ...appointment }))
    .filter(entry => !term || [entry.date, entry.numero, entry.tema, entry.orador, entry.congregacao]
      .some(value => String(value || '').toLowerCase().includes(term)))
    .sort((first, second) => first.date.localeCompare(second.date));
  upcomingCount.textContent = `(${upcomingEntries.length})`;
  upcomingSpeechesBody.innerHTML = upcomingEntries.length
    ? upcomingEntries.map(entry => `<tr><td>${formatHistoryDate(entry.date)}</td><td>${escapeHistoryHtml(entry.numero || '-')}</td><td>${escapeHistoryHtml(entry.tema || '-')}</td><td>${escapeHistoryHtml(entry.orador || '-')}</td><td>${escapeHistoryHtml(entry.congregacao || '-')}</td></tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">Nenhum discurso a fazer encontrado.</td></tr>';

  const historyEntries = history.filter(entry =>
    !term || [entry.numero, entry.tema, entry.orador, entry.congregacao].some(value => String(value || '').toLowerCase().includes(term))
  );
  completedCount.textContent = `(${historyEntries.length})`;
  speechHistoryBody.innerHTML = historyEntries.length
    ? historyEntries.map(entry => `<tr><td>${formatHistoryDate(entry.date)}</td><td>${escapeHistoryHtml(entry.numero || '-')}</td><td>${escapeHistoryHtml(entry.tema || '-')}</td><td>${escapeHistoryHtml(entry.orador || '-')}</td><td>${escapeHistoryHtml(entry.congregacao || '-')}</td></tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">Nenhum discurso realizado registrado.</td></tr>';
}

historySearch.addEventListener('input', renderSpeechHistory);
renderSpeechHistory();
