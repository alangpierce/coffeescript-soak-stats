import { readdir, readFile, stat, writeFile } from 'mz/fs';
import { join, relative, resolve } from 'path';
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
    let source = (await readFile(coffeePath)).toString();
    if (source[0] === '\uFEFF') {
      source = source.slice(1);
    }
    source = source.replace(/\r\n/g, '\n');
    const resolvedPath = relative('.', coffeePath);
    try {
      collectStats(source, stats, resolvedPath);
    } catch (e) {
      process.stdout.write(`\rError processing file ${resolvedPath}\n`);
      if (process.env['SHOW_ERRORS'] === 'true') {
        console.log(e);
      }
    }
  }
  console.log('');
  console.log(stats.format());
  if (stats.exampleContents) {
    await writeFile('./soak-examples.txt', stats.exampleContents);
    console.log('Wrote examples to soak-examples.txt');
  }
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
