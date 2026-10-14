/* ===================== CALENDÁRIO ===================== */

const CalendarApp = (() => {
  let currentDate = new Date();
  let selectedDateKey = null;

  const monthLabel = document.getElementById('monthLabel');
  const grid = document.getElementById('calendarGrid');
  const legendList = document.getElementById('legendList');
  const modal = document.getElementById('appointmentModal');
  const modalDateLabel = document.getElementById('modalDateLabel');
  const form = document.getElementById('appointmentForm');
  const colorPicker = document.getElementById('colorPicker');
  const customColor = document.getElementById('customColor');
  const deleteBtn = document.getElementById('deleteAppointmentBtn');
  const markCompletedBtn = document.getElementById('markCompletedBtn');

  const MONTH_NAMES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  let selectedColor = '#4361ee';

  function pad(n) { return String(n).padStart(2, '0'); }

  function dateKey(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function render() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent = `${MONTH_NAMES[month]} de ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      grid.appendChild(empty);
    }

    const all = Storage.getAll();
    const usedColors = new Map();

    for (let day = 1; day <= daysInMonth; day++) {
      const key = dateKey(year, month, day);
      const cell = document.createElement('div');
      cell.className = 'day-cell';

      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      if (isToday) cell.classList.add('today');

      const event = all[key];
      if (event) {
        cell.classList.add('has-event');
        const cor = event.isLocalDesignation ? '#1fae5b' : (event.cor || '#4361ee');
        cell.style.background = cor;
        if (event.isLocalDesignation) cell.classList.add('designacao-local');
        usedColors.set(cor, true);
      }

      const numberEl = document.createElement('div');
      numberEl.className = 'day-number';
      numberEl.textContent = day;
      cell.appendChild(numberEl);

      if (event) {
        const info = document.createElement('div');
        info.className = 'event-info';
        info.textContent = `${event.orador || ''}${event.congregacao ? ' - ' + event.congregacao : ''}`;
        cell.appendChild(info);
      }

      cell.addEventListener('click', () => openModal(key, day, month, year));
      grid.appendChild(cell);
    }

    renderLegend(all);
  }

  function renderLegend(all) {
    const colors = new Map();
    Object.values(all).forEach(ev => {
      const cor = ev.isLocalDesignation ? '#1fae5b' : ev.cor;
      if (!cor || colors.has(cor)) return;
      const label = ev.isLocalDesignation ? `Designação: ${ev.orador || '-'}` : (ev.orador || 'Agendamento');
      colors.set(cor, label);
    });

    legendList.innerHTML = '';
    if (colors.size === 0) {
      legendList.innerHTML = '<span style="color:#adb5bd">Nenhum agendamento colorido ainda.</span>';
      return;
    }

    colors.forEach((label, color) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-dot" style="background:${color}"></span> ${label}`;
      legendList.appendChild(item);
    });
  }

  function openModal(key, day, month, year) {
    selectedDateKey = key;
    const existing = Storage.get(key);

    modalDateLabel.textContent = `Agendamento - ${pad(day)}/${pad(month + 1)}/${year}` + (existing?.isLocalDesignation ? ' (Designação de Orador Local)' : '') + (existing?.realizadoEm ? ' (Discurso realizado)' : '');

    document.getElementById('orador').value = existing?.orador || '';
    document.getElementById('congregacao').value = existing?.congregacao || '';
    document.getElementById('tema').value = existing?.tema || '';
    document.getElementById('numero').value = existing?.numero || '';
    document.getElementById('telefone').value = existing?.telefone || '';
    document.getElementById('presidente').value = existing?.presidente || '';
    document.getElementById('dirigenteSentinela').value = existing?.dirigenteSentinela || '';
    document.getElementById('oracaoFinal').value = existing?.oracaoFinal || '';
    document.getElementById('observacoes').value = existing?.observacoes || '';

    selectedColor = existing?.cor || '#4361ee';
    customColor.value = selectedColor;
    updateSwatchSelection();

    deleteBtn.classList.toggle('hidden', !existing);
    markCompletedBtn.classList.toggle('hidden', !existing);
    markCompletedBtn.disabled = Boolean(existing?.realizadoEm);
    markCompletedBtn.textContent = existing?.realizadoEm
      ? `Realizado em ${existing.realizadoEm.split('-').reverse().join('/')}`
      : 'Marcar como realizado';

    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    form.reset();
    selectedDateKey = null;
  }

  function updateSwatchSelection() {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.classList.toggle('selected', swatch.dataset.color === selectedColor);
    });
  }

  colorPicker.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-swatch')) {
      selectedColor = e.target.dataset.color;
      customColor.value = selectedColor;
      updateSwatchSelection();
    }
  });

  customColor.addEventListener('input', (e) => {
    selectedColor = e.target.value;
    updateSwatchSelection();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedDateKey) return;

    const data = {
      orador: document.getElementById('orador').value.trim(),
      congregacao: document.getElementById('congregacao').value.trim(),
      tema: document.getElementById('tema').value.trim(),
      numero: document.getElementById('numero').value.trim(),
      telefone: document.getElementById('telefone').value.trim(),
      presidente: document.getElementById('presidente').value.trim(),
      dirigenteSentinela: document.getElementById('dirigenteSentinela').value.trim(),
      oracaoFinal: document.getElementById('oracaoFinal').value.trim(),
      observacoes: document.getElementById('observacoes').value.trim(),
      cor: selectedColor,
      realizadoEm: Storage.get(selectedDateKey)?.realizadoEm || ''
    };

    const conflict = AppointmentRules.findConflict(selectedDateKey, data, Storage.getAll(), TalkHistoryStorage.getAll());
    if (conflict) {
      const dateLabel = conflict.key.split('-').reverse().join('/');
      const message = conflict.type === 'orador'
        ? `Este orador já está agendado neste mês (${dateLabel}).`
        : conflict.type === 'realizado'
          ? `O discurso Nº ${conflict.value} foi realizado em ${dateLabel} e só poderá ser repetido após cinco meses.`
        : `Este discurso já foi agendado na congregação "${conflict.congregation || 'não informada'}" em ${dateLabel}. Aguarde três meses ou informe outra congregação.`;
      alert(`Não foi possível salvar: ${message}`);
      e.stopImmediatePropagation();
      return;
    }

    Storage.save(selectedDateKey, data);
    if (data.realizadoEm) TalkHistoryStorage.saveCompleted(selectedDateKey, data);
    closeModal();
    render();
  });

  markCompletedBtn.addEventListener('click', () => {
    if (!selectedDateKey) return;
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (selectedDateKey > today) {
      alert('Não é possível marcar como realizado antes da data do discurso.');
      return;
    }

    const data = Storage.get(selectedDateKey);
    if (!data) return;
    const updated = {
      ...data,
      orador: document.getElementById('orador').value.trim(),
      congregacao: document.getElementById('congregacao').value.trim(),
      tema: document.getElementById('tema').value.trim(),
      numero: document.getElementById('numero').value.trim(),
      telefone: document.getElementById('telefone').value.trim(),
      presidente: document.getElementById('presidente').value.trim(),
      dirigenteSentinela: document.getElementById('dirigenteSentinela').value.trim(),
      oracaoFinal: document.getElementById('oracaoFinal').value.trim(),
      observacoes: document.getElementById('observacoes').value.trim(),
      cor: selectedColor,
      realizadoEm: selectedDateKey
    };
    if (!updated.numero) {
      alert('Informe o número do discurso antes de marcá-lo como realizado.');
      return;
    }
    const conflict = AppointmentRules.findCompletedConflict(selectedDateKey, updated, TalkHistoryStorage.getAll());
    if (conflict) {
      const dateLabel = conflict.key.split('-').reverse().join('/');
      alert(`O discurso Nº ${conflict.value} já foi realizado em ${dateLabel}.`);
      return;
    }

    Storage.save(selectedDateKey, updated);
    TalkHistoryStorage.saveCompleted(selectedDateKey, updated);
    const dateLabel = selectedDateKey.split('-').reverse().join('/');
    closeModal();
    render();
    alert(`Discurso feito: Nº ${updated.numero || '-'} - ${updated.orador || 'Orador não informado'}, realizado em ${dateLabel}.`);
  });

  deleteBtn.addEventListener('click', () => {
    if (!selectedDateKey) return;
    if (confirm('Deseja realmente excluir este agendamento?')) {
      Storage.remove(selectedDateKey);
      closeModal();
      render();
    }
  });

  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    render();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    render();
  });

  function init() {
    currentDate = new Date();
    render();
  }

  function getCurrentMonthData() {
    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      monthName: MONTH_NAMES[currentDate.getMonth()]
    };
  }

  function getMonthEntries() {
    const { year, month } = getCurrentMonthData();
    const monthPrefix = `${year}-${pad(month + 1)}`;
    const all = Storage.getAll();
    return Object.keys(all)
      .filter(key => key.startsWith(monthPrefix))
      .sort()
      .map(key => ({ key, ...all[key] }));
  }

  function openModalForDate(key) {
    const [year, month, day] = key.split('-').map(Number);
    openModal(key, day, month - 1, year);
  }

  return { init, getCurrentMonthData, getMonthEntries, openModalForDate, render };
})();
