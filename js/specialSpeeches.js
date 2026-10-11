if (!Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}

const specialSpeechForm = document.getElementById('specialSpeechForm');
const specialSpeechesBody = document.getElementById('specialSpeechesBody');
const specialSpeechSearch = document.getElementById('specialSpeechSearch');
const cancelSpecialSpeechEditBtn = document.getElementById('cancelSpecialSpeechEditBtn');

function escapeSpecialSpeechHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function resetSpecialSpeechForm() {
  specialSpeechForm.reset();
  document.getElementById('specialSpeechId').value = '';
  document.getElementById('saveSpecialSpeechBtn').textContent = 'Salvar discurso';
  cancelSpecialSpeechEditBtn.classList.add('hidden');
}

function renderSpecialSpeeches() {
  const term = specialSpeechSearch.value.trim().toLowerCase();
  const records = SpecialSpeechesStorage.getAll()
    .filter(record => [record.numero, record.tema, record.orador, record.congregacao]
      .some(value => String(value || '').toLowerCase().includes(term)))
    .sort((first, second) => String(first.tema).localeCompare(String(second.tema), 'pt-BR'));

  specialSpeechesBody.innerHTML = records.length
    ? records.map(record => `
      <tr data-id="${escapeSpecialSpeechHtml(record.id)}">
        <td>${escapeSpecialSpeechHtml(record.numero || '-')}</td>
        <td>${escapeSpecialSpeechHtml(record.tema)}</td>
        <td>${escapeSpecialSpeechHtml(record.orador)}</td>
        <td>${escapeSpecialSpeechHtml(record.congregacao || '-')}</td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-icon-sm" data-action="edit" title="Editar" aria-label="Editar">✏️</button>
          <button type="button" class="btn btn-icon-sm" data-action="delete" title="Excluir" aria-label="Excluir">🗑️</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">Nenhum discurso especial cadastrado.</td></tr>';
}

specialSpeechForm.addEventListener('submit', event => {
  event.preventDefault();
  SpecialSpeechesStorage.save({
    id: document.getElementById('specialSpeechId').value || null,
    numero: document.getElementById('specialSpeechNumber').value.trim(),
    tema: document.getElementById('specialSpeechTopic').value.trim(),
    orador: document.getElementById('specialSpeechSpeaker').value.trim(),
    congregacao: document.getElementById('specialSpeechCongregation').value.trim()
  });
  resetSpecialSpeechForm();
  renderSpecialSpeeches();
});

specialSpeechesBody.addEventListener('click', event => {
  const row = event.target.closest('tr[data-id]');
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!row || !action) return;

  const record = SpecialSpeechesStorage.getAll().find(item => item.id === row.dataset.id);
  if (!record) return;
  if (action === 'edit') {
    document.getElementById('specialSpeechId').value = record.id;
    document.getElementById('specialSpeechNumber').value = record.numero || '';
    document.getElementById('specialSpeechTopic').value = record.tema || '';
    document.getElementById('specialSpeechSpeaker').value = record.orador || '';
    document.getElementById('specialSpeechCongregation').value = record.congregacao || '';
    document.getElementById('saveSpecialSpeechBtn').textContent = 'Salvar alterações';
    cancelSpecialSpeechEditBtn.classList.remove('hidden');
    document.getElementById('specialSpeechTopic').focus();
  }
  if (action === 'delete' && confirm(`Excluir o discurso especial "${record.tema}"?`)) {
    SpecialSpeechesStorage.remove(record.id);
    if (document.getElementById('specialSpeechId').value === record.id) resetSpecialSpeechForm();
    renderSpecialSpeeches();
  }
});

cancelSpecialSpeechEditBtn.addEventListener('click', resetSpecialSpeechForm);
specialSpeechSearch.addEventListener('input', renderSpecialSpeeches);
renderSpecialSpeeches();
