import { collectStats, Stats } from '../src/stats';
import { equal } from 'assert';

function getStats(source: string): Stats {
  const stats = new Stats();
  collectStats(source, stats);
  return stats;
}

describe('stats', () => {
  it('identifies soak containers stopping at parens', () => {
    const stats = getStats('(a?.b).c');
    equal(stats.numNonTrivialSoakContainers, 0);
  });

  it('identifies nontrivial soak containers', () => {
    const stats = getStats('a?.b.c');
    equal(stats.numNonTrivialSoakContainers, 1);
  });

  it('treats repeated chaining as only trivial soak containers', () => {
    const stats = getStats('a?.b?.c');
    equal(stats.numSoakOperations, 2);
    equal(stats.numNonTrivialSoakContainers, 0);
  });
});
