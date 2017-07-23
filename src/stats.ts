import { parse, traverse } from 'decaffeinate-parser';
import {
  BaseAssignOp, DeleteOp, FunctionApplication,
  SoakedDynamicMemberAccessOp, SoakedFunctionApplication, SoakedMemberAccessOp,
  SoakedNewOp, Node,
} from 'decaffeinate-parser/dist/nodes';
import {
  findSoakContainer, isSoakedExpression, isSoakOperation
} from './soak-operations';
import { formatExample } from './examples';

export class Stats {
  totalFiles = 0;
  totalLines = 0;
  numSoakOperations = 0;
  numSoakedMemberAccesses = 0;
  numSoakedDynamicMemberAccesses = 0;
  numSoakedFunctionApplications = 0;
  numSoakedNew = 0;
  numNonTrivialSoakContainers = 0;
  numNonTrivialSoakContainersExcludingMethods = 0;
  numSoakedAssignments = 0;
  numSoakedDeletes = 0;
  numSignificantParens = 0;
  numChainedSoakOperations = 0;
  exampleContents = '';

  format(): string {
    return `\
Total files: ${this.totalFiles}
Total lines: ${this.totalLines}
Total soak operations: ${this.numSoakOperations}
Total soaked member accesses: ${this.numSoakedMemberAccesses}
Total soaked dynamic member accesses: ${this.numSoakedDynamicMemberAccesses}
Total soaked function applications: ${this.numSoakedFunctionApplications}
Total soaked new invocations: ${this.numSoakedNew}
Total soak operations using short-circuiting: ${this.numNonTrivialSoakContainers}
Total soak operations using short-circuiting (excluding methods): ${this.numNonTrivialSoakContainersExcludingMethods}
Total soaked assignments (including compound assignments): ${this.numSoakedAssignments}
Total soaked deletes: ${this.numSoakedDeletes}
Total cases where parens affected the soak container: ${this.numSignificantParens}
Total soak operations chained on top of another soak: ${this.numChainedSoakOperations}`;
  }
}

export function collectStats(source: string, stats: Stats, path: string): void {
  const program = parse(source);
  const tokens = program.context.sourceTokens;
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
    }
    if (isSoakOperation(node)) {
      stats.numSoakOperations++;
      const soakContainer = findSoakContainer(node, tokens);
      const soakContainerIgnoringParens = findSoakContainer(node, tokens, {ignoreParens: true});
      if (soakContainer !== node) {
        stats.numNonTrivialSoakContainers++;
        let isMethodSoakContainer = soakContainer instanceof FunctionApplication &&
          soakContainer.function === node;
        if (!isMethodSoakContainer) {
          stats.numNonTrivialSoakContainersExcludingMethods++;
        }
      }
      if (soakContainer instanceof BaseAssignOp) {
        stats.numSoakedAssignments++;
      }
      if (soakContainer instanceof DeleteOp) {
        stats.numSoakedDeletes++;
      }
      if (soakContainer !== soakContainerIgnoringParens) {
        stats.numSignificantParens++;
      }
      if (isSoakedExpression(soakContainer)) {
        stats.numChainedSoakOperations++;
      }

      if (process.env.PRINT_EXAMPLES === 'true' && shouldShowExample(node, soakContainer)) {
        stats.exampleContents += formatExample(node, source, path);
      }
    }
  });
}

function shouldShowExample(node: Node, soakContainer: Node): boolean {
  if (node !== soakContainer) {
    let isMethodSoakContainer = soakContainer instanceof FunctionApplication &&
      soakContainer.function === node;
    return !isMethodSoakContainer;
  }
  return false;
}
