export class Stats {
  totalFiles = 0;
  totalLines = 0;

  format(): string {
    return `\
Total files: ${this.totalFiles}
Total lines: ${this.totalLines}`;
  }
}

export function collectStats(source: string, stats: Stats): void {
  stats.totalFiles++;
  stats.totalLines += source.split('\n').length;
}
