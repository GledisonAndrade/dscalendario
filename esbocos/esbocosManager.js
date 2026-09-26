/* ===================== INTEGRAÇÃO DE ESBOÇOS COM O AGENDAMENTO ===================== */
/* Preenche as datalists de tema/número no modal de agendamento e mantém os dois campos
   sincronizados automaticamente, além de fornecer a tela de gerenciamento dos esboços. */

function refreshEsbocosDatalists() {
  const temasList = document.getElementById('temasEsbocosList');
  const numerosList = document.getElementById('numerosEsbocosList');
  if (!temasList || !numerosList) return;

  const esbocos = Esbocos.getAll();
  temasList.innerHTML = esbocos.map(e => `<option value="${e.tema.replace(/"/g, '&quot;')}">Nº ${e.numero}</option>`).join('');
  numerosList.innerHTML = esbocos.map(e => `<option value="${e.numero}">${e.tema.replace(/"/g, '&quot;')}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  refreshEsbocosDatalists();

  const temaInput = document.getElementById('tema');
  const numeroInput = document.getElementById('numero');

  if (temaInput && numeroInput) {
    temaInput.addEventListener('input', () => {
      const match = Esbocos.findByTema(temaInput.value.trim());
      if (match) numeroInput.value = match.numero;
    });

    numeroInput.addEventListener('input', () => {
      const match = Esbocos.findByNumero(numeroInput.value.trim());
      if (match) temaInput.value = match.tema;
    });
  }
});

/* ===================== MODAL DE GERENCIAMENTO DE ESBOÇOS ===================== */

const esbocosModal = document.getElementById('esbocosModal');
const esbocosListEl = document.getElementById('esbocosList');
const esbocoForm = document.getElementById('esbocoForm');
const esbocoNumeroInput = document.getElementById('esbocoNumero');
const esbocoTemaInput = document.getElementById('esbocoTema');
const cancelEsbocoEditBtn = document.getElementById('cancelEsbocoEditBtn');
const esbocoSearchInput = document.getElementById('esbocoSearch');

let editingEsbocoNumero = null;

function renderEsbocosList(filter = '') {
  if (!esbocosListEl) return;
  const term = filter.trim().toLowerCase();
  const esbocos = Esbocos.getAll().filter(e =>
    !term || e.numero.includes(term) || e.tema.toLowerCase().includes(term)
  );

  if (esbocos.length === 0) {
    esbocosListEl.innerHTML = '<p class="empty-msg">Nenhum esboço encontrado.</p>';
    return;
  }

  esbocosListEl.innerHTML = esbocos.map(e => `
    <div class="designation-item" data-numero="${e.numero}">
      <div class="speaker-info">
        <span class="speaker-date">Nº ${e.numero}</span>
        <strong class="speaker-name">${e.tema}</strong>
      </div>
      <div class="speaker-actions">
        <button type="button" class="btn btn-icon-sm edit-esboco-btn" title="Alterar">✏️</button>
        <button type="button" class="btn btn-icon-sm delete-esboco-btn" title="Excluir">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openEsbocosModal() {
  editingEsbocoNumero = null;
  esbocoForm.reset();
  cancelEsbocoEditBtn.classList.add('hidden');
  if (esbocoSearchInput) esbocoSearchInput.value = '';
  renderEsbocosList();
  esbocosModal.classList.remove('hidden');
}

function closeEsbocosModal() {
  esbocosModal.classList.add('hidden');
  refreshEsbocosDatalists();
}

document.getElementById('manageEsbocosBtn')?.addEventListener('click', openEsbocosModal);
document.getElementById('closeEsbocosModalBtn')?.addEventListener('click', closeEsbocosModal);
esbocosModal?.addEventListener('click', (e) => { if (e.target === esbocosModal) closeEsbocosModal(); });

esbocoSearchInput?.addEventListener('input', () => renderEsbocosList(esbocoSearchInput.value));

esbocoForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const numero = esbocoNumeroInput.value.trim();
  const tema = esbocoTemaInput.value.trim();
  if (!numero || !tema) return;

  const conflict = Esbocos.findByNumero(numero);
  if (conflict && String(numero) !== String(editingEsbocoNumero)) {
    if (!confirm(`Já existe o esboço Nº ${numero} ("${conflict.tema}"). Deseja substituí-lo?`)) return;
  }

  Esbocos.upsert(numero, tema, editingEsbocoNumero);
  editingEsbocoNumero = null;
  esbocoForm.reset();
  cancelEsbocoEditBtn.classList.add('hidden');
  renderEsbocosList(esbocoSearchInput?.value || '');
});

cancelEsbocoEditBtn?.addEventListener('click', () => {
  editingEsbocoNumero = null;
  esbocoForm.reset();
  cancelEsbocoEditBtn.classList.add('hidden');
});

esbocosListEl?.addEventListener('click', (e) => {
  const item = e.target.closest('.designation-item');
  if (!item) return;
  const numero = item.dataset.numero;
  const esboco = Esbocos.findByNumero(numero);

  if (e.target.closest('.edit-esboco-btn')) {
    editingEsbocoNumero = numero;
    esbocoNumeroInput.value = esboco.numero;
    esbocoTemaInput.value = esboco.tema;
    cancelEsbocoEditBtn.classList.remove('hidden');
    esbocoNumeroInput.focus();
  }

  if (e.target.closest('.delete-esboco-btn')) {
    if (confirm(`Excluir o esboço Nº ${numero} ("${esboco.tema}")?`)) {
      Esbocos.remove(numero);
      renderEsbocosList(esbocoSearchInput?.value || '');
    }
  }
});

document.getElementById('resetEsbocosBtn')?.addEventListener('click', () => {
  if (confirm('Isso vai restaurar a lista padrão de 194 esboços e remover suas alterações personalizadas. Continuar?')) {
    Esbocos.resetToDefault();
    renderEsbocosList(esbocoSearchInput?.value || '');
  }
});
