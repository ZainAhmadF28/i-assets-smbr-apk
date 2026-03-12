const XLSX = require('xlsx');
const workbook = XLSX.readFile('Master Data Aset Umum.XLSX');
const sheet = workbook.Sheets['Aset Tetap per 30 Jun 2025'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2, blankrows: false });
const categories = new Set();
const conditions = new Set();
data.forEach(row => {
  if (row[2]) categories.add(row[2].toString().trim());
  if (row[11]) conditions.add(row[11].toString().trim());
});
console.log("KATEGORI:", Array.from(categories));
console.log("KONDISI:", Array.from(conditions));
