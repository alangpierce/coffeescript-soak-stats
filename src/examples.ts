
import { Node } from 'decaffeinate-parser/dist/nodes';
import LinesAndColumns from 'lines-and-columns';

export function formatExample(node: Node, source: string, path: string): string {
  let {start, end} = node;
  start = Math.min(Math.max(start, 0), source.length);
  end = Math.min(Math.max(end, start), source.length);
  let lineMap = new LinesAndColumns(source);
  let startLoc = lineMap.locationForIndex(start);
  let endLoc = lineMap.locationForIndex(end);

  if (!startLoc || !endLoc) {
    throw new Error(`unable to find locations for range: [${start}, ${end})`);
  }

  let displayStartLine = Math.max(0, startLoc.line - 2);
  let displayEndLine = endLoc.line + 2;

  let rows: Array<Array<string>> = [];

  for (let line = displayStartLine; line <= displayEndLine; line++) {
    let startOfLine = lineMap.indexForLocation({ line, column: 0 });
    let endOfLine = lineMap.indexForLocation({ line: line + 1, column: 0 });
    if (startOfLine === null) {
      break;
    }
    if (endOfLine === null) {
      endOfLine = source.length;
    }
    let lineSource = trimRight(source.slice(startOfLine, endOfLine));
    if (startLoc.line !== endLoc.line) {
      if (line >= startLoc.line && line <= endLoc.line) {
        rows.push(
          [`>`, `${line + 1} |`, lineSource]
        );
      } else {
        rows.push(
          [``, `${line + 1} |`, lineSource]
        );
      }
    } else if (line === startLoc.line) {
      let highlightLength = Math.max(endLoc.column - startLoc.column, 1);
      rows.push(
        [`>`, `${line + 1} |`, lineSource],
        [``, `|`, ' '.repeat(startLoc.column) + '^'.repeat(highlightLength)]
      );
    } else {
      rows.push(
        [``, `${line + 1} |`, lineSource]
      );
    }
  }

  let columns: Array<Column> = [
    { id: 'marker', align: 'right' },
    { id: 'line', align: 'right' },
    { id: 'source', align: 'left' }
  ];

  return `Example from ${path}:\n${printTable({ rows, columns })}\n\n`;
}

function trimRight(string: string): string {
  return string.replace(/\s+$/, '');
}

type Column = {
  id: string,
  align: 'left' | 'right',
};

type Table = {
  rows: Array<Array<string>>,
  columns: Array<Column>,
};

function printTable(table: Table, buffer: string=' '): string {
  let widths: Array<number> = [];
  table.rows.forEach(row => {
    row.forEach((cell, i) => {
      if (widths.length <= i) {
        widths[i] = cell.length;
      }
      else if (widths[i] < cell.length) {
        widths[i] = cell.length;
      }
    });
  });
  let output = '';
  table.rows.forEach(row => {
    row.forEach((cell, i) => {
      let column = table.columns[i];
      if (column.align === 'left') {
        output += cell;
      } else if (column.align === 'right') {
        output += ' '.repeat(widths[i] - cell.length) + cell;
      }
      if (i < row.length - 1) {
        output += buffer;
      }
    });
    output += '\n';
  });
  return output;
}
