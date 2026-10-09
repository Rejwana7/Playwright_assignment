import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StatementTableData } from '../pages/SelfStatementPage';

function escapeCsvValue(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function getDhakaDate(date = new Date()): string {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = dateParts.find((part) => part.type === 'year')?.value;
  const month = dateParts.find((part) => part.type === 'month')?.value;
  const day = dateParts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Unable to create the Self Statement file date.');
  }

  return `${year}-${month}-${day}`;
}

export function getStatementCsvFileName(): string {
  return `self_statement_${getDhakaDate()}.csv`;
}

export function filterStatementDataForToday(
  data: StatementTableData,
): StatementTableData {
  const dateColumnIndex = data.headers.findIndex(
    (header) => header.trim().toLowerCase() === 'date',
  );

  if (dateColumnIndex === -1) {
    throw new Error('The Self Statement table has no Date column.');
  }

  const today = getDhakaDate();
  const rows = data.rows.filter((row) => {
    const [datePart] = row[dateColumnIndex].split(',');
    const [day, month, year] = datePart.trim().split('/');

    if (!day || !month || !year) {
      return false;
    }

    const transactionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return transactionDate === today;
  });

  return { headers: data.headers, rows };
}

export async function saveStatementDataToCsv(
  data: StatementTableData,
): Promise<string> {
  const csvRows = [data.headers, ...data.rows].map((row) =>
    row.map(escapeCsvValue).join(','),
  );
  const filePath = path.resolve(process.cwd(), getStatementCsvFileName());

  await writeFile(filePath, `${csvRows.join('\r\n')}\r\n`, 'utf8');
  return filePath;
}
