/* ===================== REGRAS DE NEGÓCIO DOS AGENDAMENTOS ===================== */

(function (root) {
  function normalize(value) {
    return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function addMonths(dateKey, months) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const targetMonth = month - 1 + months;
    const firstOfTargetMonth = new Date(Date.UTC(year, targetMonth, 1));
    const lastDay = new Date(Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth() + 1, 0)).getUTCDate();
    firstOfTargetMonth.setUTCDate(Math.min(day, lastDay));
    return firstOfTargetMonth.toISOString().slice(0, 10);
  }

  function areWithinMonths(firstDate, secondDate, months) {
    const earlier = firstDate < secondDate ? firstDate : secondDate;
    const later = firstDate < secondDate ? secondDate : firstDate;
    return later < addMonths(earlier, months);
  }

  function findCompletedConflict(dateKey, appointment, completedHistory) {
    const number = normalize(appointment.numero);
    if (!number) return null;

    for (const completed of completedHistory || []) {
      if (completed.date === dateKey || normalize(completed.numero) !== number) continue;
      if (areWithinMonths(dateKey, completed.date, 5)) {
        return { type: 'realizado', value: appointment.numero, key: completed.date, appointment: completed };
      }
    }
    return null;
  }

  function findConflict(dateKey, appointment, allAppointments, completedHistory = []) {
    const completedConflict = findCompletedConflict(dateKey, appointment, completedHistory);
    if (completedConflict) return completedConflict;

    const monthPrefix = String(dateKey).slice(0, 7);
    const speaker = normalize(appointment.orador);
    const number = normalize(appointment.numero);
    const topic = normalize(appointment.tema);
    const congregation = normalize(appointment.congregacao);

    if (!speaker && !number && !topic) return null;

    for (const [key, existing] of Object.entries(allAppointments || {})) {
      if (key === dateKey) continue;

      if (speaker && key.startsWith(monthPrefix) && normalize(existing.orador) === speaker) {
        return { type: 'orador', value: appointment.orador, key, appointment: existing };
      }

      const sameNumber = number && normalize(existing.numero) === number;
      const sameTopic = topic && normalize(existing.tema) === topic;
      const sameTalk = number && topic
        ? sameNumber && sameTopic
        : sameNumber || sameTopic;
      if (!sameTalk || !areWithinMonths(dateKey, key, 3)) continue;

      const existingCongregation = normalize(existing.congregacao);
      if (!congregation || !existingCongregation || congregation === existingCongregation) {
        return {
          type: 'tema',
          value: appointment.numero || appointment.tema,
          key,
          appointment: existing,
          congregation: existing.congregacao || appointment.congregacao
        };
      }
    }

    return null;
  }

  root.AppointmentRules = { findConflict, findCompletedConflict, addMonths };
})(globalThis);
