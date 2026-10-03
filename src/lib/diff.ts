import type { DiffLine } from '../types';

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseDiff(diff: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldNo = 0;
  let newNo = 0;

  const raw = diff.replace(/^\n+/, '').replace(/\n+\s*$/, '').split('\n');
  for (const row of raw) {
    const header = row.match(HUNK_HEADER);
    if (header) {
      oldNo = Number(header[1]);
      newNo = Number(header[2]);
      lines.push({ kind: 'hunk', content: row });
      continue;
    }

    const sign = row[0];
    const content = row.slice(1);
    if (sign === '+') {
      lines.push({ kind: 'add', content, newNo: newNo++ });
    } else if (sign === '-') {
      lines.push({ kind: 'del', content, oldNo: oldNo++ });
    } else {
      // Editors often strip the leading space of blank context lines.
      lines.push({ kind: 'context', content, oldNo: oldNo++, newNo: newNo++ });
    }
  }

  return lines;
}

export function diffStats(lines: DiffLine[]) {
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.kind === 'add') additions++;
    if (line.kind === 'del') deletions++;
  }
  return { additions, deletions };
}

export function rangeLabel(lines: DiffLine[], start: number, end: number): string {
  const number = (line: DiffLine) =>
    line.kind === 'del' ? `${line.oldNo} (removida)` : String(line.newNo);
  if (start === end) return `linha ${number(lines[start])}`;
  return `linhas ${number(lines[start])} a ${number(lines[end])}`;
}

/** Lines a suggestion would replace: everything in the range that survives the PR. */
export function replaceableLines(lines: DiffLine[], start: number, end: number): string[] {
  return lines
    .slice(start, end + 1)
    .filter((line) => line.kind === 'add' || line.kind === 'context')
    .map((line) => line.content);
}

export function markerFor(kind: DiffLine['kind']): string {
  if (kind === 'add') return '+';
  if (kind === 'del') return '-';
  return ' ';
}
