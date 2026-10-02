import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import parseChangeset from '@changesets/parse';

export const findGitRoot = (cwd) => {
    let directory = resolve(cwd);
    while (!existsSync(join(directory, '.git'))) {
        const parent = dirname(directory);
        if (parent === directory) return null;
        directory = parent;
    }
    return directory;
};

export const git = (cwd, ...args) => {
    const root = findGitRoot(cwd);
    if (!root) throw new Error('This command requires a Git checkout');
    const result = spawnSync('git', ['-c', `safe.directory=${root}`, ...args], {
        cwd,
        encoding: 'utf8',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr.trim() || 'Git command failed');
    return result.stdout.trim();
};

export const checkChangesets = ({
    cwd = process.cwd(),
    base,
    head = 'HEAD',
    remote = 'origin',
} = {}) => {
    const config = JSON.parse(readFileSync(join(cwd, '.changeset/config.json'), 'utf8'));
    const baseRef = base ?? `${remote}/${config.baseBranch ?? 'main'}`;
    const resolveCommit = (ref) =>
        git(cwd, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`);
    const baseCommit = resolveCommit(baseRef);
    const headCommit = resolveCommit(head);
    const mergeBase = git(cwd, 'merge-base', baseCommit, headCommit);
    if (mergeBase === headCommit) return { head, files: [], skipped: true };

    const project = relative(findGitRoot(cwd), resolve(cwd)).replaceAll('\\', '/');
    const prefix = project ? `${project}/` : '';
    const changesetDirectory = `${prefix}.changeset/`;
    const files = git(
        cwd,
        'diff',
        '--no-relative',
        '--name-only',
        '-z',
        '--diff-filter=A',
        mergeBase,
        headCommit,
        '--',
        `:(top,literal)${changesetDirectory}`
    )
        .split('\0')
        .filter((file) => {
            const name = file.slice(changesetDirectory.length);
            return (
                file.startsWith(changesetDirectory) &&
                /^[^/]+\.md$/.test(name) &&
                name !== 'README.md'
            );
        });
    if (!files.length) throw new Error(`${head}: no new committed changeset since ${baseRef}`);

    const { name } = JSON.parse(git(cwd, 'show', `${headCommit}:${prefix}package.json`));
    for (const file of files) {
        const changeset = parseChangeset(git(cwd, 'show', `${headCommit}:${file}`));
        if (
            !changeset.summary ||
            changeset.releases.length !== 1 ||
            changeset.releases[0].name !== name ||
            !['patch', 'minor', 'major'].includes(changeset.releases[0].type)
        ) {
            throw new Error(
                `${file}: provide a description and a patch, minor or major release for ${name}`
            );
        }
    }
    return { head, files, skipped: false };
};

export const checkPush = (input, options = {}) => {
    const results = [];
    for (const line of input.trim().split('\n').filter(Boolean)) {
        const refs = line.trim().split(/\s+/);
        if (refs.length !== 4) throw new Error('Invalid pre-push input');
        const [, head, target] = refs;
        if (!target.startsWith('refs/heads/') || /^0+$/.test(head)) continue;
        results.push(checkChangesets({ ...options, head }));
    }
    return results;
};
