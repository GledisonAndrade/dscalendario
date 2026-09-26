/* ===================== LISTA DE ORADORES DO MÊS ===================== */

const speakersModal = document.getElementById('speakersModal');
const speakersList = document.getElementById('speakersList');
const speakersModalTitle = document.getElementById('speakersModalTitle');
let returningToSpeakers = false;

function formatDateLabel(key) {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

function renderSpeakersList() {
  const { monthName, year } = CalendarApp.getCurrentMonthData();
  speakersModalTitle.textContent = `Oradores de ${monthName} de ${year}`;

  const entries = CalendarApp.getMonthEntries();

  if (entries.length === 0) {
    speakersList.innerHTML = '<p class="empty-msg">Nenhum orador agendado para este mês.</p>';
    return;
  }

  speakersList.innerHTML = entries.map(entry => `
    <div class="speaker-item" style="border-left-color:${entry.cor || '#4361ee'}" data-key="${entry.key}">
      <div class="speaker-info">
        <span class="speaker-date">${formatDateLabel(entry.key)}</span>
        <strong class="speaker-name">${entry.orador || 'Sem nome'}</strong>
        <span class="speaker-detail">${entry.congregacao || '-'}</span>
        <span class="speaker-detail">${entry.tema || '-'}${entry.numero ? ' (Nº ' + entry.numero + ')' : ''}</span>
        <span class="speaker-detail">${entry.telefone || '-'}</span>
      </div>
      <div class="speaker-actions">
        <button type="button" class="btn btn-icon-sm speaker-edit" title="Alterar">✏️</button>
        <button type="button" class="btn btn-icon-sm speaker-delete" title="Excluir">🗑️</button>
      </div>
    </div>
  `).join('');
}

speakersList.addEventListener('click', (e) => {
  const item = e.target.closest('.speaker-item');
  if (!item) return;
  const key = item.dataset.key;

  if (e.target.closest('.speaker-edit')) {
    speakersModal.classList.add('hidden');
    returningToSpeakers = true;
    CalendarApp.openModalForDate(key);
  }

  if (e.target.closest('.speaker-delete')) {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      Storage.remove(key);
      renderSpeakersList();
      CalendarApp.render();
    }
  }
});

document.getElementById('viewSpeakersBtn').addEventListener('click', () => {
  renderSpeakersList();
  speakersModal.classList.remove('hidden');
});

document.getElementById('closeSpeakersModalBtn').addEventListener('click', () => {
  speakersModal.classList.add('hidden');
});

speakersModal.addEventListener('click', (e) => {
  if (e.target === speakersModal) speakersModal.classList.add('hidden');
});

document.getElementById('speakersDownloadPdfBtn').addEventListener('click', generateMonthPdf);

document.getElementById('appointmentForm').addEventListener('submit', () => {
  if (returningToSpeakers) {
    returningToSpeakers = false;
    renderSpeakersList();
    speakersModal.classList.remove('hidden');
  }
});

document.getElementById('deleteAppointmentBtn').addEventListener('click', () => {
  const appointmentModal = document.getElementById('appointmentModal');
  if (returningToSpeakers && appointmentModal.classList.contains('hidden')) {
    returningToSpeakers = false;
    renderSpeakersList();
    speakersModal.classList.remove('hidden');
  }
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
  if (returningToSpeakers) {
    returningToSpeakers = false;
    renderSpeakersList();
    speakersModal.classList.remove('hidden');
  }
});
