/* ===================== STORAGE HELPER ===================== */
/* Persiste os agendamentos no localStorage no formato { "YYYY-MM-DD": { orador, congregacao, tema, numero, telefone, observacoes, cor } } */

const STORAGE_KEY = 'agendamentos_oradores';
const TALK_HISTORY_KEY = 'historico_discursos_realizados';

const Storage = {
  getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  },

  get(dateKey) {
    const all = this.getAll();
    return all[dateKey] || null;
  },

  save(dateKey, data) {
    const all = this.getAll();
    all[dateKey] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  remove(dateKey) {
    const all = this.getAll();
    delete all[dateKey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
};

const TalkHistoryStorage = {
  getAll() {
    const raw = localStorage.getItem(TALK_HISTORY_KEY);
    const savedHistory = raw ? JSON.parse(raw) : [];
    const historyByDate = new Map(savedHistory.map(entry => [entry.date, entry]));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const appointments = Storage.getAll();
    let migrated = false;

    Object.entries(appointments).forEach(([date, appointment]) => {
      const completedDate = appointment.realizadoEm || date;
      if (completedDate > today || (!appointment.realizadoEm && date === today) || historyByDate.has(completedDate)) return;

      historyByDate.set(completedDate, {
        date: completedDate,
        orador: appointment.orador || '',
        congregacao: appointment.congregacao || '',
        tema: appointment.tema || '',
        numero: appointment.numero || '',
        speakerId: appointment.speakerId || '',
        isLocalDesignation: Boolean(appointment.isLocalDesignation)
      });
      migrated = true;
    });

    const history = Array.from(historyByDate.values());
    if (migrated) localStorage.setItem(TALK_HISTORY_KEY, JSON.stringify(history));
    return history;
  },

  saveCompleted(dateKey, appointment) {
    const history = this.getAll().filter(entry => entry.date !== dateKey);
    history.push({
      date: dateKey,
      orador: appointment.orador || '',
      congregacao: appointment.congregacao || '',
      tema: appointment.tema || '',
      numero: appointment.numero || '',
      speakerId: appointment.speakerId || '',
      isLocalDesignation: Boolean(appointment.isLocalDesignation)
    });
    localStorage.setItem(TALK_HISTORY_KEY, JSON.stringify(history));
  }
};

const SPECIAL_SPEECHES_KEY = 'discursos_especiais';

const SpecialSpeechesStorage = {
  getAll() {
    const raw = localStorage.getItem(SPECIAL_SPEECHES_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  save(record) {
    const all = this.getAll();
    const savedRecord = {
      ...record,
      id: record.id || `special_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
    const index = all.findIndex(item => item.id === savedRecord.id);
    if (index >= 0) all[index] = savedRecord;
    else all.push(savedRecord);
    localStorage.setItem(SPECIAL_SPEECHES_KEY, JSON.stringify(all));
    return savedRecord;
  },

  remove(id) {
    const remaining = this.getAll().filter(record => record.id !== id);
    localStorage.setItem(SPECIAL_SPEECHES_KEY, JSON.stringify(remaining));
  }
};

/* ===================== ORADORES LOCAIS ===================== */
/* Persiste o cadastro de oradores locais no formato [{ id, nome, telefone, cor, temas: [{tema, numero}] }] */

const LOCAL_SPEAKERS_KEY = 'oradores_locais';

const LocalSpeakersStorage = {
  getAll() {
    const raw = localStorage.getItem(LOCAL_SPEAKERS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  get(id) {
    return this.getAll().find(s => s.id === id) || null;
  },

  save(record) {
    const all = this.getAll();
    if (record.id) {
      const idx = all.findIndex(s => s.id === record.id);
      if (idx >= 0) {
        all[idx] = record;
      } else {
        all.push(record);
      }
    } else {
      record.id = `os_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      all.push(record);
    }
    localStorage.setItem(LOCAL_SPEAKERS_KEY, JSON.stringify(all));
    return record;
  },

  remove(id) {
    const all = this.getAll().filter(s => s.id !== id);
    localStorage.setItem(LOCAL_SPEAKERS_KEY, JSON.stringify(all));
  }
};
