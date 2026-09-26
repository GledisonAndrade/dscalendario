/* ===================== GERAÇÃO DE PDF ===================== */

function hexToRgb(hex) {
  const clean = (hex || '#4361ee').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/* Escolhe texto claro ou escuro conforme o brilho da cor de fundo */
function contrastColor({ r, g, b }) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? { r: 33, g: 37, b: 41 } : { r: 255, g: 255, b: 255 };
}

function generateMonthPdf() {
  const { year, month, monthName } = CalendarApp.getCurrentMonthData();
  const all = Storage.getAll();

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const entries = Object.keys(all)
    .filter(key => key.startsWith(monthPrefix))
    .sort()
    .map(key => ({ date: key, ...all[key] }));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const cardWidth = pageWidth - marginX * 2;

  doc.setFillColor(67, 97, 238);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`Oradores do mês - ${monthName} de ${year}`, marginX, 17);

  let y = 36;

  if (entries.length === 0) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text('Nenhum agendamento encontrado para este mês.', marginX, y);
  } else {
    entries.forEach((entry) => {
      const [, , day] = entry.date.split('-');
      const cor = entry.cor || '#4361ee';
      const bg = hexToRgb(cor);
      const fg = contrastColor(bg);

      const linhas = [
        `Orador: ${entry.orador || '-'}`,
        `Congregação: ${entry.congregacao || '-'}`,
        `Tema: ${entry.tema || '-'}   Nº: ${entry.numero || '-'}`,
        `Telefone: ${entry.telefone || '-'}`,
        entry.observacoes ? `Observações: ${entry.observacoes}` : null
      ].filter(Boolean);

      const cardHeight = 14 + linhas.length * 6;

      if (y + cardHeight > 285) {
        doc.addPage();
        y = 20;
      }

      // Cartão colorido conforme a cor escolhida no calendário
      doc.setFillColor(bg.r, bg.g, bg.b);
      doc.roundedRect(marginX, y, cardWidth, cardHeight, 3, 3, 'F');

      doc.setTextColor(fg.r, fg.g, fg.b);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${day}/${String(month + 1).padStart(2, '0')}/${year}`, marginX + 6, y + 9);
      doc.setFont(undefined, 'normal');

      let ly = y + 16;
      doc.setFontSize(10.5);
      linhas.forEach(linha => {
        doc.text(doc.splitTextToSize(linha, cardWidth - 12), marginX + 6, ly);
        ly += 6;
      });

      y += cardHeight + 6;
    });
  }

  doc.save(`oradores_${monthName.toLowerCase()}_${year}.pdf`);
}

document.getElementById('downloadPdfBtn').addEventListener('click', generateMonthPdf);
