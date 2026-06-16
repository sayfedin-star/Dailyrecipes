import fs from 'fs';
import path from 'path';

const searchDirectories = [
  'node_modules/astro'
];

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Target the check inside astro.mjs
    if (content.includes('is not supported by Astro!')) {
      console.log(`Found node version check in: ${filePath}`);
      content = content.replace(/!semver\.satisfies\(version,\s*engines\)/g, 'false');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched: ${filePath}`);
    }
  } catch (err) {
    // Ignore errors for unreadable files
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
      patchFile(filePath);
    }
  }
}

console.log('Running patch-astro.js...');
searchDirectories.forEach(walkDir);

// Target node_modules/@rafters/astro-meta/dist/astro.js for glob import patch
const raftersMetaPath = 'node_modules/@rafters/astro-meta/dist/astro.js';
if (fs.existsSync(raftersMetaPath)) {
  let content = fs.readFileSync(raftersMetaPath, 'utf8');
  if (content.includes('import { glob, mkdir, readFile, writeFile } from "node:fs/promises";')) {
    console.log(`Patching @rafters/astro-meta/dist/astro.js for Node 20 compatibility...`);
    content = content.replace(
      'import { glob, mkdir, readFile, writeFile } from "node:fs/promises";',
      `import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import { join as pathJoin, relative, sep } from "node:path";
async function* glob(pattern, options) {
  const cwd = options.cwd;
  function* walk(dir) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = pathJoin(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        yield* walk(fullPath);
      } else if (file.endsWith(".html")) {
        yield pathJoin(relative(cwd, dir), file).split(sep).join("/");
      }
    }
  }
  yield* walk(cwd);
}`
    );
    fs.writeFileSync(raftersMetaPath, content, 'utf8');
    console.log(`Successfully patched @rafters/astro-meta/dist/astro.js`);
  }
}

console.log('Finished patch-astro.js');
