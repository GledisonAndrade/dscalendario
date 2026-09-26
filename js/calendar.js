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

    modalDateLabel.textContent = `Agendamento - ${pad(day)}/${pad(month + 1)}/${year}` + (existing?.isLocalDesignation ? ' (Designação de Orador Local)' : '');

    document.getElementById('orador').value = existing?.orador || '';
    document.getElementById('congregacao').value = existing?.congregacao || '';
    document.getElementById('tema').value = existing?.tema || '';
    document.getElementById('numero').value = existing?.numero || '';
    document.getElementById('telefone').value = existing?.telefone || '';
    document.getElementById('observacoes').value = existing?.observacoes || '';

    selectedColor = existing?.cor || '#4361ee';
    customColor.value = selectedColor;
    updateSwatchSelection();

    deleteBtn.classList.toggle('hidden', !existing);

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
      observacoes: document.getElementById('observacoes').value.trim(),
      cor: selectedColor
    };

    Storage.save(selectedDateKey, data);
    closeModal();
    render();
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
