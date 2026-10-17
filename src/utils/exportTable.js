// Export table rows to CSV or PDF (BR E.4).
// rows = what the user sees after filter and sort. columns = [{ field, header }].

const todayStamp = () => new Date().toISOString().slice(0, 10)

// Excel runs cells that start with = + - @ as formulas. Adding ' in front makes them plain text.
const neutraliseFormula = (text) => (/^[=+\-@\t\r]/.test(text) ? `'${text}` : text)

const cellText = (value) => {
  if (value === null || value === undefined) return ''
  return neutraliseFormula(String(value))
}

// Put quotes around a cell that has a comma, quote or new line, and double any quotes inside.
const csvCell = (value) => {
  const text = cellText(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportCsv(rows, columns, name) {
  const lines = [
    columns.map((column) => csvCell(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => csvCell(row[column.field])).join(',')),
  ]
  // \ufeff at the start tells Excel the file is UTF-8.
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  download(blob, `commongoal-${name}-${todayStamp()}.csv`)
}

// jsPDF is big, so it only downloads when someone clicks Export PDF.
export async function exportPdf(rows, columns, name, title) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text(title, 40, 44)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`CommonGoal, generated ${new Date().toLocaleString('en-AU')}, ${rows.length} rows`, 40, 60)

  autoTable(doc, {
    startY: 72,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => cellText(row[column.field]))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [25, 135, 84] },
    didDrawPage: () => {
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 70, doc.internal.pageSize.getHeight() - 20)
    },
  })

  doc.save(`commongoal-${name}-${todayStamp()}.pdf`)
}
