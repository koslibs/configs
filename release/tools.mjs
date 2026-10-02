import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

export const toolBin = (name) => {
    const manifest = require.resolve(`${name}/package.json`);
    const { bin } = JSON.parse(readFileSync(manifest, 'utf8'));
    const executable = typeof bin === 'string' ? bin : Object.values(bin)[0];
    return resolve(dirname(manifest), executable);
};

export const runTool = (name, args, cwd = process.cwd()) => {
    const result = spawnSync(process.execPath, [toolBin(name), ...args], {
        cwd,
        stdio: 'inherit',
    });
    if (result.error) throw result.error;
    return result.status ?? 1;
};
