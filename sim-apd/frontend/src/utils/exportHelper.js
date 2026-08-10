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

/**
 * Ekspor data menggunakan template Excel yang ada
 * @param {Array<Array<any>>} data - Baris data
 * @param {string} filename - Nama file yang akan diunduh
 * @param {number} startRow - Baris mulai untuk mengisi data (1-indexed)
 * @param {string} periodLabel - Label periode kustom untuk ditulis di cell A4
 */
export async function exportToTemplateExcel(data, filename, startRow = 2, periodLabel = '') {
  try {
    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    
    const response = await fetch('/template.xlsx');
    if (!response.ok) throw new Error(`Template tidak ditemukan (status ${response.status}). Pastikan file template.xlsx ada di folder public.`);
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('File template.xlsx tidak ditemukan di folder public. Silakan tambahkan file template.xlsx ke folder public.');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];

    // Set custom period label in Excel cell B4 (A4 is the static "Periode" label in the template)
    // B4 format in template is ": <value>", so we replicate that
    if (periodLabel) {
      worksheet.getCell('B4').value = `: ${periodLabel}`;
    } else {
      worksheet.getCell('B4').value = '';
    }
    
    // Simpan gaya (style) dari baris pertama data template untuk diduplikasi
    const templateStyles = [];
    for (let col = 1; col <= 11; col++) {
      const cell = worksheet.getRow(startRow).getCell(col);
      templateStyles[col] = {
        border: cell.border,
        alignment: cell.alignment,
        font: cell.font,
        fill: cell.fill,
        numFmt: cell.numFmt
      };
    }
    
    // Cari baris 'Ringkasan'
    let ringkasanRowIdx = -1;
    for (let r = startRow; r < 200; r++) {
      const row = worksheet.getRow(r);
      const cellA = row.getCell(1).value;
      let cellAStr = '';
      if (cellA && typeof cellA === 'string') cellAStr = cellA;
      else if (cellA && cellA.richText) cellAStr = cellA.richText.map(t => t.text).join('');
      
      if (cellAStr.toLowerCase().includes('ringkasan')) {
        ringkasanRowIdx = r;
        break;
      }
    }

    if (ringkasanRowIdx !== -1) {
      // Hapus SEMUA baris di antara startRow sampai Ringkasan
      const rowsToDelete = ringkasanRowIdx - startRow;
      if (rowsToDelete > 0) {
        worksheet.spliceRows(startRow, rowsToDelete);
      }
      
      // Sisipkan baris kosong SEJUMLAH data
      if (data.length > 0) {
        const emptyRows = Array(data.length).fill([]);
        worksheet.spliceRows(startRow, 0, ...emptyRows);
      }
    } else {
      // Fallback jika tidak ada footer Ringkasan
      let currentRow = startRow;
      while (currentRow < 100) {
        const row = worksheet.getRow(currentRow);
        for (let col = 1; col <= 11; col++) {
          const cell = row.getCell(col);
          cell.value = null;
          cell.border = undefined;
        }
        row.commit();
        currentRow++;
      }
    }
    
    data.forEach((rowData, index) => {
      const row = worksheet.getRow(startRow + index);
      let maxLines = 1;
      rowData.forEach((value, colIndex) => {
        const colNum = colIndex + 1;
        const cell = row.getCell(colNum);
        cell.value = value;
        
        if (typeof value === 'string') {
          const lines = value.split('\n').length;
          if (lines > maxLines) maxLines = lines;
        }
        
        // Aplikasikan style dari template
        if (templateStyles[colNum]) {
          if (templateStyles[colNum].border) cell.border = templateStyles[colNum].border;
          if (templateStyles[colNum].alignment) cell.alignment = templateStyles[colNum].alignment;
          if (templateStyles[colNum].font) cell.font = templateStyles[colNum].font;
          if (templateStyles[colNum].fill) cell.fill = templateStyles[colNum].fill;
          if (templateStyles[colNum].numFmt) cell.numFmt = templateStyles[colNum].numFmt;
        }
      });
      // Sesuaikan tinggi baris berdasarkan jumlah baris teks terbanyak (sekitar 15 point per baris teks)
      row.height = Math.max(25, maxLines * 15);
      row.commit();
    });
    
    // Hitung ringkasan otomatis
    let totalPengajuan = data.length;
    let pengajuanAktif = 0;
    let pengajuanSelesai = 0;
    let totalItem = 0;
    
    data.forEach(row => {
      // row[8] adalah status, row[7] adalah total_item
      const status = row[8];
      const items = parseInt(row[7]) || 0;
      
      totalItem += items;
      if (status === 'Aktif') pengajuanAktif++;
      if (status === 'Selesai') pengajuanSelesai++;
    });

    // Update bagian Ringkasan di Excel yang baru (sudah tergeser ke startRow + data.length)
    const newRingkasanIdx = startRow + data.length;
    for (let r = newRingkasanIdx; r < newRingkasanIdx + 10; r++) {
      const row = worksheet.getRow(r);
      const cellA = row.getCell(1).value;
      if (cellA) {
        let txt = '';
        if (typeof cellA === 'string') txt = cellA.toLowerCase();
        else if (cellA.richText) txt = cellA.richText.map(t => t.text).join('').toLowerCase();
        
        if (txt.includes('total pengajuan')) row.getCell(2).value = totalPengajuan;
        if (txt.includes('pengajuan aktif')) row.getCell(2).value = pengajuanAktif;
        if (txt.includes('pengajuan selesai')) row.getCell(2).value = pengajuanSelesai;
        if (txt.includes('total item apd')) row.getCell(2).value = totalItem;
      }
      row.commit();
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to template:', error);
    throw error;
  }
}
