#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { checkChangesets, checkPush } from '../release/check.mjs';
import { installHooks } from '../release/hooks.mjs';
import { runTool } from '../release/tools.mjs';

const argv = process.argv.slice(2);
const command = argv.shift();
const commands = [
    'add',
    'check',
    'version',
    'publish',
    'status',
    'init',
    'hooks:install',
    'hooks:run',
];

try {
    if (!command || command === '--help' || command === '-h') {
        console.info(
            `Usage: koslibs-release <command>\n\n${commands.join('\n')}\n\ncheck: --base <ref> --head <ref> --remote <name> --cwd <directory> --pre-push\nOther commands forward arguments to their bundled tools.`
        );
    } else if (!commands.includes(command)) {
        throw new Error(`Unknown command "${command}". Run koslibs-release --help.`);
    } else if (command === 'check') {
        const { values } = parseArgs({
            args: argv,
            options: {
                base: { type: 'string' },
                head: { type: 'string', default: 'HEAD' },
                remote: { type: 'string', default: 'origin' },
                cwd: { type: 'string', default: process.cwd() },
                'pre-push': { type: 'boolean', default: false },
            },
        });
        const options = {
            cwd: resolve(values.cwd),
            base: values.base,
            head: values.head,
            remote: values.remote,
        };
        const results = values['pre-push']
            ? checkPush(readFileSync(0, 'utf8'), options)
            : [checkChangesets(options)];
        for (const result of results)
            console.info(
                `${result.head}: ${result.skipped ? 'no new commits' : `${result.files.length} committed changeset(s) validated`}`
            );
    } else if (command === 'hooks:install') {
        if (argv.length)
            throw new Error('hooks:install takes no arguments; run it from the Git checkout root');
        process.exitCode = installHooks();
    } else if (command === 'hooks:run') {
        process.exitCode = runTool('lefthook', argv);
    } else {
        process.exitCode = runTool('@changesets/cli', [command, ...argv]);
    }
} catch (error) {
    console.error(error.message);
    if (command === 'check') {
        console.error(
            'Run npm run changeset, describe the change, then commit the .changeset/*.md file before pushing.'
        );
        console.error(
            'Ensure the remote base branch is available: git fetch <remote> <baseBranch>.'
        );
    }
    process.exitCode = 1;
}
