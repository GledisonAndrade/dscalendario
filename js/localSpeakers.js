/* ===================== ORADORES LOCAIS - PÁGINA DEDICADA ===================== */

if (!Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}

const localSpeakersList = document.getElementById('localSpeakersList');
const localSpeakerModal = document.getElementById('localSpeakerModal');
const localSpeakerModalTitle = document.getElementById('localSpeakerModalTitle');
const localSpeakerForm = document.getElementById('localSpeakerForm');
const temasList = document.getElementById('temasList');
const localColorPicker = document.getElementById('localColorPicker');
const localCustomColor = document.getElementById('localCustomColor');
const deleteLocalSpeakerBtn = document.getElementById('deleteLocalSpeakerBtn');

let editingId = null;
let selectedLocalColor = '#4361ee';

function createTemaRow(tema = '', numero = '') {
  const row = document.createElement('div');
  row.className = 'tema-row';
  row.innerHTML = `
    <input type="text" class="tema-input" list="temasEsbocosDatalist" placeholder="Tema do discurso" value="${tema.replace(/"/g, '&quot;')}">
    <input type="text" class="numero-input" list="numerosEsbocosDatalist" placeholder="Nº" inputmode="numeric" value="${numero.replace(/"/g, '&quot;')}">
    <button type="button" class="btn btn-icon-sm remove-tema-btn" title="Remover">✕</button>
  `;
  row.querySelector('.remove-tema-btn').addEventListener('click', () => row.remove());
  const temaInput = row.querySelector('.tema-input');
  const numeroInput = row.querySelector('.numero-input');
  temaInput.addEventListener('input', () => {
    const match = Esbocos.findByTema(temaInput.value.trim());
    if (match) numeroInput.value = match.numero;
  });
  numeroInput.addEventListener('input', () => {
    const match = Esbocos.findByNumero(numeroInput.value.trim());
    if (match) temaInput.value = match.tema;
  });
  return row;
}

(function ensureEsbocosDatalists() {
  if (document.getElementById('temasEsbocosDatalist')) return;
  const temasDatalist = document.createElement('datalist');
  temasDatalist.id = 'temasEsbocosDatalist';
  const numerosDatalist = document.createElement('datalist');
  numerosDatalist.id = 'numerosEsbocosDatalist';
  Esbocos.getAll().forEach(e => {
    temasDatalist.innerHTML += `<option value="${e.tema.replace(/"/g, '&quot;')}">Nº ${e.numero}</option>`;
    numerosDatalist.innerHTML += `<option value="${e.numero}">${e.tema.replace(/"/g, '&quot;')}</option>`;
  });
  document.body.appendChild(temasDatalist);
  document.body.appendChild(numerosDatalist);
})();

document.getElementById('addTemaBtn').addEventListener('click', () => {
  temasList.appendChild(createTemaRow());
});

function updateLocalSwatchSelection() {
  document.querySelectorAll('#localColorPicker .color-swatch').forEach(swatch => {
    swatch.classList.toggle('selected', swatch.dataset.color === selectedLocalColor);
  });
}

localColorPicker.addEventListener('click', (e) => {
  if (e.target.classList.contains('color-swatch')) {
    selectedLocalColor = e.target.dataset.color;
    localCustomColor.value = selectedLocalColor;
    updateLocalSwatchSelection();
  }
});

localCustomColor.addEventListener('input', (e) => {
  selectedLocalColor = e.target.value;
  updateLocalSwatchSelection();
});

function renderLocalSpeakers() {
  const speakers = LocalSpeakersStorage.getAll();

  if (speakers.length === 0) {
    localSpeakersList.innerHTML = '<p class="empty-msg">Nenhum orador local cadastrado ainda.</p>';
    return;
  }

  localSpeakersList.innerHTML = speakers.map(s => `
    <div class="local-speaker-card" style="border-top-color:${s.cor || '#4361ee'}" data-id="${s.id}">
      <div class="local-speaker-header">
        <strong>${s.nome}</strong>
        <span class="legend-dot" style="background:${s.cor || '#4361ee'}"></span>
      </div>
      <div class="speaker-detail">📞 ${s.telefone || '-'}</div>
      <div class="local-speaker-temas">
        ${(s.temas || []).map(t => `<span class="tema-badge">${t.tema}${t.numero ? ' (Nº ' + t.numero + ')' : ''}</span>`).join('') || '<span class="speaker-detail">Nenhum tema cadastrado.</span>'}
      </div>
      <div class="speaker-actions">
        <button type="button" class="btn btn-icon-sm edit-local-btn" title="Alterar">✏️</button>
        <button type="button" class="btn btn-icon-sm delete-local-btn" title="Excluir">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openLocalSpeakerModal(speaker = null) {
  editingId = speaker?.id || null;
  localSpeakerModalTitle.textContent = editingId ? 'Alterar Orador' : 'Novo Orador';
  document.getElementById('localNome').value = speaker?.nome || '';
  document.getElementById('localTelefone').value = speaker?.telefone || '';

  temasList.innerHTML = '';
  const temas = speaker?.temas?.length ? speaker.temas : [{ tema: '', numero: '' }];
  temas.forEach(t => temasList.appendChild(createTemaRow(t.tema || '', t.numero || '')));

  selectedLocalColor = speaker?.cor || '#4361ee';
  localCustomColor.value = selectedLocalColor;
  updateLocalSwatchSelection();

  deleteLocalSpeakerBtn.classList.toggle('hidden', !editingId);
  localSpeakerModal.classList.remove('hidden');
}

function closeLocalSpeakerModal() {
  localSpeakerModal.classList.add('hidden');
  localSpeakerForm.reset();
  editingId = null;
}

document.getElementById('addLocalSpeakerBtn').addEventListener('click', () => openLocalSpeakerModal());
document.getElementById('closeLocalSpeakerModalBtn').addEventListener('click', closeLocalSpeakerModal);
localSpeakerModal.addEventListener('click', (e) => { if (e.target === localSpeakerModal) closeLocalSpeakerModal(); });

localSpeakersList.addEventListener('click', (e) => {
  const card = e.target.closest('.local-speaker-card');
  if (!card) return;
  const id = card.dataset.id;

  if (e.target.closest('.edit-local-btn')) {
    openLocalSpeakerModal(LocalSpeakersStorage.get(id));
    return;
  }

  if (e.target.closest('.delete-local-btn')) {
    if (confirm('Deseja realmente excluir este orador local?')) {
      LocalSpeakersStorage.remove(id);
      renderLocalSpeakers();
    }
    return;
  }

  openLocalSpeakerDetails(LocalSpeakersStorage.get(id));
});

deleteLocalSpeakerBtn.addEventListener('click', () => {
  if (!editingId) return;
  if (confirm('Deseja realmente excluir este orador local?')) {
    LocalSpeakersStorage.remove(editingId);
    closeLocalSpeakerModal();
    renderLocalSpeakers();
  }
});

localSpeakerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const temas = Array.from(temasList.querySelectorAll('.tema-row'))
    .map(row => ({
      tema: row.querySelector('.tema-input').value.trim(),
      numero: row.querySelector('.numero-input').value.trim()
    }))
    .filter(t => t.tema || t.numero);

  const record = {
    id: editingId,
    nome: document.getElementById('localNome').value.trim(),
    telefone: document.getElementById('localTelefone').value.trim(),
    cor: selectedLocalColor,
    temas
  };

  LocalSpeakersStorage.save(record);
  closeLocalSpeakerModal();
  renderLocalSpeakers();
});

renderLocalSpeakers();

/* ===================== DETALHES DO ORADOR E DESIGNAÇÃO ===================== */

const localSpeakerDetailsModal = document.getElementById('localSpeakerDetailsModal');
const detailsSpeakerName = document.getElementById('detailsSpeakerName');
const detailsPhone = document.getElementById('detailsPhone');
const detailsTemasList = document.getElementById('detailsTemasList');
const designacaoData = document.getElementById('designacaoData');
const designacaoTema = document.getElementById('designacaoTema');
const designacaoCongregacao = document.getElementById('designacaoCongregacao');
const designacoesExistentes = document.getElementById('designacoesExistentes');

let detailsSpeaker = null;

function openLocalSpeakerDetails(speaker) {
  if (!speaker) return;
  detailsSpeaker = speaker;
  detailsSpeakerName.textContent = speaker.nome;
  detailsPhone.textContent = speaker.telefone || '-';

  detailsTemasList.innerHTML = (speaker.temas || []).map(t =>
    `<span class="tema-badge">${t.tema}${t.numero ? ' (Nº ' + t.numero + ')' : ''}</span>`
  ).join('') || '<span class="speaker-detail">Nenhum tema cadastrado.</span>';

  designacaoTema.innerHTML = (speaker.temas || []).map((t, i) =>
    `<option value="${i}">${t.tema}${t.numero ? ' (Nº ' + t.numero + ')' : ''}</option>`
  ).join('') || '<option value="">Nenhum tema disponível</option>';

  designacaoData.value = '';
  designacaoCongregacao.value = '';

  renderDesignacoesExistentes();
  localSpeakerDetailsModal.classList.remove('hidden');
}

function closeLocalSpeakerDetails() {
  localSpeakerDetailsModal.classList.add('hidden');
  detailsSpeaker = null;
}

document.getElementById('closeDetailsModalBtn').addEventListener('click', closeLocalSpeakerDetails);
localSpeakerDetailsModal.addEventListener('click', (e) => {
  if (e.target === localSpeakerDetailsModal) closeLocalSpeakerDetails();
});

function renderDesignacoesExistentes() {
  if (!detailsSpeaker) return;
  const all = Storage.getAll();
  const entries = Object.keys(all)
    .filter(key => all[key].isLocalDesignation && all[key].speakerId === detailsSpeaker.id)
    .sort()
    .map(key => ({ key, ...all[key] }));

  if (entries.length === 0) {
    designacoesExistentes.innerHTML = '<p class="empty-msg">Nenhuma designação marcada para este orador.</p>';
    return;
  }

  designacoesExistentes.innerHTML = entries.map(entry => {
    const [year, month, day] = entry.key.split('-');
    return `
      <div class="designation-item" data-key="${entry.key}">
        <div class="speaker-info">
          <span class="speaker-date">${day}/${month}/${year}</span>
          <strong class="speaker-name">${entry.tema || '-'}${entry.numero ? ' (Nº ' + entry.numero + ')' : ''}</strong>
        </div>
        <div class="speaker-actions">
          <button type="button" class="btn btn-icon-sm designacao-pdf-btn" title="Baixar PDF">📄</button>
          <button type="button" class="btn btn-icon-sm designacao-remove-btn" title="Remover">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

designacoesExistentes.addEventListener('click', (e) => {
  const item = e.target.closest('.designation-item');
  if (!item) return;
  const key = item.dataset.key;
  const entry = Storage.get(key);

  if (e.target.closest('.designacao-pdf-btn')) {
    generateDesignationPdf(key, entry);
  }

  if (e.target.closest('.designacao-remove-btn')) {
    if (confirm('Deseja remover esta designação do calendário?')) {
      Storage.remove(key);
      renderDesignacoesExistentes();
    }
  }
});

document.getElementById('marcarDesignacaoBtn').addEventListener('click', () => {
  if (!detailsSpeaker) return;

  const temaIndex = designacaoTema.value;
  const tema = detailsSpeaker.temas?.[temaIndex];

  if (!tema) {
    alert('Cadastre ao menos um tema para este orador antes de designar.');
    return;
  }
  if (!designacaoData.value) {
    alert('Selecione a data do discurso.');
    return;
  }

  const data = {
    orador: detailsSpeaker.nome,
    congregacao: designacaoCongregacao.value.trim(),
    tema: tema.tema,
    numero: tema.numero,
    telefone: detailsSpeaker.telefone,
    observacoes: '',
    cor: '#1fae5b',
    isLocalDesignation: true,
    speakerId: detailsSpeaker.id
  };

  const conflict = AppointmentRules.findConflict(designacaoData.value, data, Storage.getAll(), TalkHistoryStorage.getAll());
  if (conflict) {
    const dateLabel = conflict.key.split('-').reverse().join('/');
    const message = conflict.type === 'orador'
      ? `Este orador já está agendado neste mês (${dateLabel}).`
      : conflict.type === 'realizado'
        ? `O discurso Nº ${conflict.value} foi realizado em ${dateLabel} e só poderá ser repetido após cinco meses.`
      : `Este discurso já foi agendado na congregação "${conflict.congregation || 'não informada'}" em ${dateLabel}. Aguarde três meses ou informe outra congregação.`;
    alert(`Não foi possível marcar: ${message}`);
    return;
  }

  Storage.save(designacaoData.value, data);
  renderDesignacoesExistentes();
  alert('Designação marcada no calendário com sucesso!');
});

function generateDesignationPdf(key, entry) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const [year, month, day] = key.split('-');

  doc.setFillColor(31, 174, 91);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Designação para Discurso Público', 14, 19);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(13);
  let y = 46;
  const linhas = [
    `Data: ${day}/${month}/${year}`,
    `Orador: ${entry.orador || '-'}`,
    `Congregação: ${entry.congregacao || '-'}`,
    `Tema: ${entry.tema || '-'}`,
    `Número: ${entry.numero || '-'}`,
    `Telefone: ${entry.telefone || '-'}`
  ];
  linhas.forEach(linha => {
    doc.text(linha, 14, y);
    y += 10;
  });

  doc.setDrawColor(31, 174, 91);
  doc.setLineWidth(1);
  doc.line(14, y + 4, pageWidth - 14, y + 4);

  doc.setFontSize(14);
  doc.setTextColor(31, 174, 91);
  doc.text('Sua designação. Bom discurso!!!', 14, y + 18);

  doc.save(`designacao_${entry.orador?.replace(/\s+/g, '_') || 'orador'}_${day}-${month}-${year}.pdf`);
}