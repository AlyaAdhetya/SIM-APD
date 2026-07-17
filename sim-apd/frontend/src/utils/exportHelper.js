import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Ekspor data ke Excel
 * @param {Array<string>} headers - Header kolom
 * @param {Array<Array<any>>} data - Baris data
 * @param {string} filename - Nama file (tanpa ekstensi)
 */
export function exportToExcel(headers, data, filename) {
  // Gabungkan header dan data
  const sheetData = [headers, ...data];
  
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
  
  // Auto-width kolom
  const maxLengths = headers.map((h, i) => {
    let max = h.length;
    for (let r = 0; r < data.length; r++) {
      const val = data[r][i];
      if (val !== undefined && val !== null) {
        max = Math.max(max, String(val).length);
      }
    }
    return { wch: max + 3 };
  });
  worksheet['!cols'] = maxLengths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Ekspor data ke PDF
 * @param {string} title - Judul laporan
 * @param {Array<string>} headers - Header kolom
 * @param {Array<Array<any>>} data - Baris data
 * @param {string} filename - Nama file (tanpa ekstensi)
 */
export function exportToPdf(title, headers, data, filename) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Tambahkan Header Laporan
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 21);
  
  // Garis pembatas
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 24, doc.internal.pageSize.width - 14, 24);

  // Tabel data
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [43, 76, 89], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  doc.save(`${filename}.pdf`);
}
