import { parse, traverse } from 'decaffeinate-parser';
import {
  SoakedDynamicMemberAccessOp, SoakedFunctionApplication, SoakedMemberAccessOp,
  SoakedNewOp, SoakedSlice
} from 'decaffeinate-parser/dist/nodes';

export class Stats {
  totalFiles = 0;
  totalLines = 0;
  numSoakedMemberAccesses = 0;
  numSoakedDynamicMemberAccesses = 0;
  numSoakedFunctionApplications = 0;
  numSoakedNew = 0;
  numSoakedSlice = 0;

  format(): string {
    return `\
Total files: ${this.totalFiles}
Total lines: ${this.totalLines}
Total soaked member accesses: ${this.numSoakedMemberAccesses}
Total soaked dynamic member accesses: ${this.numSoakedDynamicMemberAccesses}
Total soaked function applications: ${this.numSoakedFunctionApplications}
Total soaked new invocations: ${this.numSoakedNew}
Total soaked slice calls: ${this.numSoakedSlice}
`;
  }
}

export function collectStats(source: string, stats: Stats): void {
  const program = parse(source);
  stats.totalFiles++;
  stats.totalLines += source.split('\n').length;
  traverse(program, node => {
    if (node instanceof SoakedMemberAccessOp) {
      stats.numSoakedMemberAccesses++;
    } else if (node instanceof SoakedDynamicMemberAccessOp) {
      stats.numSoakedDynamicMemberAccesses++;
    } else if (node instanceof SoakedFunctionApplication) {
      stats.numSoakedFunctionApplications++;
    } else if (node instanceof SoakedNewOp) {
      stats.numSoakedNew++;
    } else if (node instanceof SoakedSlice) {
      stats.numSoakedSlice++;
    }
  });
}
