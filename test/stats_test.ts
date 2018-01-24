import { collectStats, Stats } from '../src/stats';
import { equal } from 'assert';

function getStats(source: string): Stats {
  const stats = new Stats();
  collectStats(source, stats, '');
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

  it('recognizes soaked new operations', () => {
    const stats = getStats('new A?()');
    equal(stats.numSoakOperations, 1);
    equal(stats.numSoakedNew, 1);
  });

  it('does not view regular chained member access as chained soak', () => {
    const stats = getStats('a?.b.c.d.e');
    equal(stats.numChainedSoakOperations, 0);
  });

  it('counts multiple chained soaks in a single chain', () => {
    const stats = getStats('a?.b.c?.d?.e');
    equal(stats.numChainedSoakOperations, 2);
  });

  it('counts a soaked assignment LHS as a soaked assignment', () => {
    const stats = getStats('a?.b = c');
    equal(stats.numSoakedAssignments, 1);
  });

  it('does not count a soaked assignment RHS as a soaked assignment', () => {
    const stats = getStats('a = b?.c');
    equal(stats.numSoakedAssignments, 0);
  });

  it('detects accesses to undeclared globals', () => {
    const stats = getStats(`
      a = {}
      b = a?.x
      c = d?.y
    `);
    equal(stats.numUndeclaredGlobalAccesses, 1);
  });

  it('respects scope when detecting undeclared globals', () => {
    const stats = getStats(`
      f = ->
        a = {}
        a?.b
      g = ->
        a?.c
      a?.d
    `);
    // The second and third usages are undeclared global accesses.
    equal(stats.numUndeclaredGlobalAccesses, 2);
  });

  it('treats function parameters as declared variables', () => {
    const stats = getStats(`
      f = (a) ->
        a?.b
    `);
    equal(stats.numUndeclaredGlobalAccesses, 0);
  });
});
