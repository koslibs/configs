import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { findGitRoot } from './check.mjs';
import { runTool } from './tools.mjs';

export const installHooks = (cwd = process.cwd()) => {
    const root = findGitRoot(cwd);
    if (!root || root.toLowerCase() !== resolve(cwd).toLowerCase()) {
        console.info('Skipping hooks installation outside the Git checkout root.');
        return 0;
    }
    const ownPackage =
        JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).name === '@koslibs/configs';
    const names = [
        'lefthook.yml',
        'lefthook.yaml',
        'lefthook.toml',
        'lefthook.json',
        'lefthook.jsonc',
    ];
    const existingConfig = names
        .flatMap((name) => [name, `.${name}`, `.config/${name}`])
        .find((name) => existsSync(join(cwd, name)));
    if (existingConfig) {
        console.info(`Using existing ${existingConfig}.`);
    } else {
        const presets = ownPackage
            ? ['./lefthook/index.yml', './lefthook/repository.yml']
            : ['./node_modules/@koslibs/configs/lefthook/index.yml'];
        const cli = ownPackage ? 'cli/release.js' : 'node_modules/@koslibs/configs/cli/release.js';
        // Only create a template; existing configs are connected manually via extends.
        const template = `extends:\n${presets.map((preset) => `    - ${preset}\n`).join('')}lefthook: node "${cli}" hooks:run\n`;
        writeFileSync(join(cwd, 'lefthook.yml'), template, { flag: 'wx' });
        console.info('Created lefthook.yml with the shared preset.');
    }
    return runTool('lefthook', ['install'], cwd);
};
