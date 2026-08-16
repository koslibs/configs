#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const prettierParams =
    '"./**/*.{ts,tsx,js,jsx,mjs,cjs,css,json}" --no-error-on-unmatched-pattern --cache';

const commandsMap = {
    js: 'eslint .',
    format: `prettier --write ${prettierParams} --list-different`,
    'format:check': `prettier --check ${prettierParams}`,
};

const possibleCommands = Object.keys(commandsMap);
const command = process.argv[2];

if (!command || !possibleCommands.includes(command)) {
    console.error(`⚠️ Use one of these commands: ${possibleCommands.join(', ')}`);

    process.exit(-1);
}

const args = process.argv.slice(3);
const commandForExec = [commandsMap[command], ...args].join(' ');

const { error } = spawnSync(commandForExec, { shell: true, stdio: ['pipe', 'inherit'] });

if (error) {
    console.error(error.message);
    process.exit(error.exitCode);
}
