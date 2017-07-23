import 'core-js/es7'

import { readdir, readFile, stat } from 'mz/fs';
import { join, resolve } from 'path';
import { collectStats, Stats } from './stats';

class CLIError extends Error {
  isCLIError = true;
}

export default function run() {
  runCli()
    .catch(e => {
      if (e.isCLIError) {
        console.log(`Error: ${e.message}`);
      } else {
        console.log(e);
      }
    });
}

async function runCli() {
  if (process.argv.length !== 3) {
    throw new CLIError('Expected exactly one CLI argument, a path to the directory to search.');
  }
  const path = process.argv[2];
  const stats = new Stats();
  for await (const coffeePath of getCoffeeFiles(path)) {
    const source = (await readFile(coffeePath)).toString();
    collectStats(source, stats);
  }
  console.log(stats.format());
}

async function* getCoffeeFiles(path: string): AsyncIterable<string> {
  let children = await readdir(path);
  for (const child of children) {
    if (['node_modules', '.git'].includes(child)) {
      continue;
    }
    let childPath = resolve(join(path, child));
    if ((await stat(childPath)).isDirectory()) {
      yield* getCoffeeFiles(childPath);
    } else if (childPath.endsWith('.coffee')) {
      yield childPath;
    }
  }
}
