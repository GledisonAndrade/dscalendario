/* ===================== TABELAS MENSAIS DE ORADORES ===================== */

const speakersModal = document.getElementById('speakersModal');
const visitorsList = document.getElementById('visitorsList');
const outgoingList = document.getElementById('outgoingList');
const speakersModalTitle = document.getElementById('speakersModalTitle');
const speakerDetailsModal = document.getElementById('speakerDetailsModal');
let returningToSpeakers = false;

function formatDateLabel(key) {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

function escapeSpeakerHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderSpeakerRows(entries, localDesignations) {
  const sectionEntries = entries.filter(entry => Boolean(entry.isLocalDesignation) === localDesignations);
  if (sectionEntries.length === 0) {
    return '<tr><td colspan="5" class="table-empty">Nenhum agendamento nesta seção para este mês.</td></tr>';
  }

  return sectionEntries.map(entry => `
    <tr data-key="${entry.key}">
      <td>${formatDateLabel(entry.key)}</td>
      <td>${escapeSpeakerHtml(entry.orador || 'Sem nome')}</td>
      <td>${escapeSpeakerHtml(entry.congregacao || '-')}</td>
      <td class="speech-cell">${escapeSpeakerHtml(entry.tema || '-')}${entry.numero ? ` (Nº ${escapeSpeakerHtml(entry.numero)})` : ''}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-outline details-action" data-action="details">Detalhes</button>
          <button type="button" class="btn btn-icon-sm" data-action="edit" title="Editar agendamento" aria-label="Editar agendamento">✏️</button>
          <button type="button" class="btn btn-icon-sm" data-action="delete" title="Excluir agendamento" aria-label="Excluir agendamento">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderSpeakersList() {
  const { monthName, year } = CalendarApp.getCurrentMonthData();
  speakersModalTitle.textContent = `Agendamentos de ${monthName} de ${year}`;

  const entries = CalendarApp.getMonthEntries();
  const visitors = entries.filter(entry => !entry.isLocalDesignation);
  const outgoing = entries.filter(entry => entry.isLocalDesignation);

  document.getElementById('visitorsCount').textContent = `(${visitors.length})`;
  document.getElementById('outgoingCount').textContent = `(${outgoing.length})`;
  visitorsList.innerHTML = renderSpeakerRows(entries, false);
  outgoingList.innerHTML = renderSpeakerRows(entries, true);
}

function showSpeakerDetails(entry) {
  const fields = {
    detailDate: formatDateLabel(entry.key),
    detailType: entry.isLocalDesignation ? 'Orador local que vai sair' : 'Orador visitante recebido',
    detailSpeaker: entry.orador || '-',
    detailCongregation: entry.congregacao || '-',
    detailTopic: entry.tema || '-',
    detailNumber: entry.numero || '-',
    detailPhone: entry.telefone || '-',
    detailNotes: entry.observacoes || '-'
  };
  Object.entries(fields).forEach(([id, value]) => {
    document.getElementById(id).textContent = value;
  });
  speakerDetailsModal.classList.remove('hidden');
}

function handleSpeakerTableClick(event) {
  const row = event.target.closest('tr[data-key]');
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!row || !action) return;

  const key = row.dataset.key;
  const entry = Storage.get(key);
  if (!entry) return;

  if (action === 'details') {
    showSpeakerDetails({ key, ...entry });
    return;
  }

  if (action === 'edit') {
    speakersModal.classList.add('hidden');
    returningToSpeakers = true;
    CalendarApp.openModalForDate(key);
    return;
  }

  if (action === 'delete' && confirm('Deseja realmente excluir este agendamento?')) {
    Storage.remove(key);
    renderSpeakersList();
    CalendarApp.render();
  }
}

visitorsList.addEventListener('click', handleSpeakerTableClick);
outgoingList.addEventListener('click', handleSpeakerTableClick);

document.getElementById('viewSpeakersBtn').addEventListener('click', () => {
  renderSpeakersList();
  speakersModal.classList.remove('hidden');
});

document.getElementById('closeSpeakersModalBtn').addEventListener('click', () => {
  speakersModal.classList.add('hidden');
});

speakersModal.addEventListener('click', event => {
  if (event.target === speakersModal) speakersModal.classList.add('hidden');
});

document.getElementById('closeSpeakerDetailsBtn').addEventListener('click', () => {
  speakerDetailsModal.classList.add('hidden');
});

speakerDetailsModal.addEventListener('click', event => {
  if (event.target === speakerDetailsModal) speakerDetailsModal.classList.add('hidden');
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
