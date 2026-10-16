/**
 * Converts an array of objects to a CSV string and triggers browser download
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, any>[],
  columns: { key: string; label: string }[]
): void {
  if (!rows || !rows.length) return;

  const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map(row => {
    return columns
      .map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'number') {
          val = val.toString();
        } else {
          val = String(val).replace(/"/g, '""');
        }
        return `"${val}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [header, ...lines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
