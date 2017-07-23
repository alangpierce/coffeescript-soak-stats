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
    equal(stats.numSignificantParens, 1);
  });

  it('does not consider parens significant if they are on the outside of the soak container', () => {
    const stats = getStats('(a?.b) + c');
    equal(stats.numNonTrivialSoakContainers, 0);
    equal(stats.numSignificantParens, 0);
  });

  it('identifies nontrivial soak containers', () => {
    const stats = getStats('a?.b.c');
    equal(stats.numNonTrivialSoakContainers, 1);
    equal(stats.numSignificantParens, 0);
  });

  it('treats repeated chaining as only trivial soak containers', () => {
    const stats = getStats('a?.b?.c');
    equal(stats.numSoakOperations, 2);
    equal(stats.numNonTrivialSoakContainers, 0);
  });

  it('identifies when a nontrivial soak container is just from a method', () => {
    const stats = getStats('a?.b()');
    equal(stats.numSoakOperations, 1);
    equal(stats.numNonTrivialSoakContainers, 1);
    equal(stats.numNonTrivialSoakContainersExcludingMethods, 0);
  });

  it('does not count chained methods as a method soak container', () => {
    const stats = getStats('a?.b().c()');
    equal(stats.numSoakOperations, 1);
    equal(stats.numNonTrivialSoakContainers, 1);
    equal(stats.numNonTrivialSoakContainersExcludingMethods, 1);
  });
});
