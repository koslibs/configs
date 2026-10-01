#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const prettierParams =
    '"./**/*.{ts,tsx,js,jsx,mjs,cjs,css,json}" --no-error-on-unmatched-pattern --cache';

const commandsMap = {
    lint: ['eslint .', `prettier --check ${prettierParams}`],
    'lint:fix': ['eslint . --fix', `prettier --write ${prettierParams} --list-different`],
    js: ['eslint .'],
    format: [`prettier --write ${prettierParams} --list-different`],
    'format:check': [`prettier --check ${prettierParams}`],
};

const possibleCommands = Object.keys(commandsMap);
const command = process.argv[2];

if (!command || !possibleCommands.includes(command)) {
    console.error(`⚠️ Use one of these commands: ${possibleCommands.join(', ')}`);

    process.exit(-1);
}

const args = process.argv.slice(3);

for (const [index, step] of commandsMap[command].entries()) {
    const commandForExec = [step, ...(index === 0 ? args : [])].join(' ');
    const { error, status } = spawnSync(commandForExec, {
        shell: true,
        stdio: ['pipe', 'inherit'],
    });

    if (error) {
        console.error(error.message);
        process.exit(1);
    }

    if (status !== 0) {
        process.exit(status ?? 1);
    }
}
