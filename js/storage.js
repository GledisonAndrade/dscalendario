/* ===================== STORAGE HELPER ===================== */
/* Persiste os agendamentos no localStorage no formato { "YYYY-MM-DD": { orador, congregacao, tema, numero, telefone, observacoes, cor } } */

const STORAGE_KEY = 'agendamentos_oradores';

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
