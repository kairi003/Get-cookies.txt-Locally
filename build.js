#!/usr/bin/env node

const fs = require('fs');
const process = require('process');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');
const { program } = require('commander');

const options = program.option('-f --firefox', 'Build for Firefox').parse(process.argv).opts();

const getGitInfo = () => {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const commitHash = execSync('git rev-parse HEAD').toString().trim();
  return { branch, commitHash };
};

const build = async ({ branch, commitHash }) => {
  const mode = options.firefox ? 'firefox' : 'chrome';
  const zipPath = `${branch.replace('/', '_')}_${commitHash.slice(0,5)}_${mode}.zip`;
  const output = fs.createWriteStream(path.join(__dirname, zipPath));

  process.chdir(path.join(__dirname, 'src'));

  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  archive.pipe(output);
  archive.glob('**/*', { ignore: ['**/*.json'] });

  const manifest = JSON.parse(fs.readFileSync('manifest.json'));
  if (options.firefox) {
    const manifestFirefox = JSON.parse(fs.readFileSync('manifest-firefox.json'));
    Object.assign(manifest, manifestFirefox);
  }
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  await archive.finalize();
  console.log('BUILD', zipPath);
};

build(getGitInfo());
