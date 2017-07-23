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
  const coffeePaths = await getCoffeeFiles(path);
  for (const [i, coffeePath] of coffeePaths.entries()) {
    process.stdout.write(`\r${i + 1}/${coffeePaths.length}`);
    const source = (await readFile(coffeePath)).toString();
    try {
      collectStats(source, stats);
    } catch (e) {
      process.stdout.write(`\rError processing file ${coffeePath}\n`);
    }
  }
  console.log('');
  console.log(stats.format());
}

async function getCoffeeFiles(path: string): Promise<Array<string>> {
  const resultFiles = [];
  let children = await readdir(path);
  for (const child of children) {
    if (['node_modules', '.git'].includes(child)) {
      continue;
    }
    let childPath = resolve(join(path, child));
    let childStat;
    try {
      childStat = await stat(childPath);
    } catch (e) {
      continue;
    }
    if (childStat.isDirectory()) {
      resultFiles.push(...await getCoffeeFiles(childPath));
    } else if (childStat.isFile() && childPath.endsWith('.coffee')) {
      resultFiles.push(childPath);
    }
  }
  return resultFiles;
}
