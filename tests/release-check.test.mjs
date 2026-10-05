import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    mkdtempSync,
    mkdirSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const checker = fileURLToPath(new URL('../cli/release.js', import.meta.url));

const require = createRequire(import.meta.url);
const changelog = pathToFileURL(require.resolve('@changesets/cli/changelog')).href;
const validChangeset = "---\n'@koslibs/api': patch\n---\n\nDescribe a package change.\n";

const fixture = (t) => {
    const root = mkdtempSync(join(tmpdir(), 'koslibs-changeset-'));
    assert.equal(dirname(root), tmpdir());
    assert.ok(root.startsWith(join(tmpdir(), 'koslibs-changeset-')));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const git = (...args) => {
        const result = spawnSync('git', ['-c', `safe.directory=${root}`, ...args], {
            cwd: root,
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        return result.stdout.trim();
    };
    const write = (path, contents) => {
        mkdirSync(dirname(join(root, path)), { recursive: true });
        writeFileSync(join(root, path), contents);
    };
    const commit = () => {
        git('add', '.');
        git('commit', '-m', 'test fixture');
        return git('rev-parse', 'HEAD');
    };
    git('init', '-b', 'main');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'commit.gpgsign', 'false');
    // Disable inherited global hooks; this fixture tests only the changeset policy.
    git('config', 'core.hooksPath', '.disabled-hooks');
    write('package.json', JSON.stringify({ name: '@koslibs/api', version: '0.1.6' }));
    write(
        '.changeset/config.json',
        JSON.stringify({
            changelog,
            access: 'public',
            baseBranch: 'main',
            commit: false,
            fixed: [],
            linked: [],
            ignore: [],
            updateInternalDependencies: 'patch',
        })
    );
    write('.changeset/old.md', validChangeset);
    const base = commit();
    git('update-ref', 'refs/remotes/origin/main', base);
    git('checkout', '-b', 'feature');
    write('change.txt', 'New feature');
    const head = commit();
    const check = (args = [], input) =>
        spawnSync(process.execPath, [checker, 'check', ...args], {
            cwd: root,
            encoding: 'utf8',
            input,
        });
    return { root, write, commit, check, git, base, head };
};

test('rejects a branch whose only changeset already exists in main', (t) => {
    const repo = fixture(t);
    const result = repo.check();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no new committed changeset/);
});

test('requires the new changeset to be committed', (t) => {
    const repo = fixture(t);
    repo.write('.changeset/new.md', validChangeset);
    assert.equal(repo.check().status, 1);
    repo.git('add', '.changeset/new.md');
    assert.equal(repo.check().status, 1);
    repo.commit();
    assert.equal(repo.check().status, 0);
});

test('rejects empty, undescribed, wrong-package and malformed changesets', (t) => {
    const repo = fixture(t);
    for (const contents of [
        '---\n---\n',
        "---\n'@koslibs/api': patch\n---\n",
        "---\n'other-package': patch\n---\nDescription\n",
        "---\n'@koslibs/api': none\n---\nDescription\n",
        "---\n'@koslibs/api': invalid\n---\nDescription\n",
    ]) {
        repo.write('.changeset/new.md', contents);
        repo.commit();
        assert.equal(repo.check().status, 1, contents);
    }
});

test('pre-push checks the pushed SHA rather than the working branch HEAD', (t) => {
    const repo = fixture(t);
    repo.write('.changeset/new.md', validChangeset);
    const headWithChangeset = repo.commit();
    const input = (head) => `refs/heads/feature ${head} refs/heads/feature ${repo.base}\n`;
    assert.equal(repo.check(['--pre-push'], input(repo.head)).status, 1);
    assert.equal(repo.check(['--pre-push'], input(headWithChangeset)).status, 0);
});

test('pre-push rejects any branch without a changeset in a multi-ref push', (t) => {
    const repo = fixture(t);
    repo.write('.changeset/new.md', validChangeset);
    const headWithChangeset = repo.commit();
    const input =
        `refs/heads/good ${headWithChangeset} refs/heads/good ${repo.base}\n` +
        `refs/heads/bad ${repo.head} refs/heads/bad ${repo.base}\n`;
    assert.equal(repo.check(['--pre-push'], input).status, 1);
});

test('allows branch deletion, tags and already merged commits', (t) => {
    const repo = fixture(t);
    const zero = '0'.repeat(40);
    const input =
        `(delete) ${zero} refs/heads/old ${repo.head}\n` +
        `refs/tags/v0.1.6 ${repo.head} refs/tags/v0.1.6 ${zero}\n` +
        `refs/heads/main ${repo.base} refs/heads/main ${zero}\n`;
    assert.equal(repo.check(['--pre-push'], input).status, 0);
});

test('CI accepts explicit base/head SHAs and fails if the base is missing', (t) => {
    const repo = fixture(t);
    repo.write('.changeset/new.md', validChangeset);
    const head = repo.commit();
    assert.equal(repo.check(['--base', repo.base, '--head', head]).status, 0);
    assert.equal(repo.check(['--base', 'origin/missing']).status, 1);
});

test('changeset version generates changelog entries and consumes pending changesets', (t) => {
    const repo = fixture(t);
    repo.write('.changeset/new.md', validChangeset);
    const result = spawnSync(process.execPath, [checker, 'version'], {
        cwd: repo.root,
        encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const pkg = JSON.parse(readFileSync(join(repo.root, 'package.json'), 'utf8'));
    assert.equal(pkg.version, '0.1.7');
    const releaseChangelog = readFileSync(join(repo.root, 'CHANGELOG.md'), 'utf8');
    assert.match(releaseChangelog, /0\.1\.7/);
    assert.match(releaseChangelog, /Describe a package change/);
    assert.match(repo.git('status', '--short'), /D .changeset\/old.md/);
});

test('uses the configured base branch and the current package name', (t) => {
    const repo = fixture(t);
    const config = JSON.parse(readFileSync(join(repo.root, '.changeset/config.json'), 'utf8'));
    config.baseBranch = 'trunk';
    repo.write('.changeset/config.json', JSON.stringify(config));
    repo.write('package.json', JSON.stringify({ name: '@example/library', version: '1.0.0' }));
    repo.write(
        '.changeset/new.md',
        '---\n"@example/library": minor\n---\nSupport another project.\n'
    );
    repo.commit();
    repo.git('update-ref', 'refs/remotes/upstream/trunk', repo.base);
    assert.equal(repo.check(['--remote', 'upstream']).status, 0);
    repo.write('.changeset/new.md', validChangeset);
    repo.commit();
    assert.equal(repo.check(['--remote', 'upstream']).status, 1);
});

test('checks packages in subdirectories even with git diff.relative enabled', (t) => {
    const repo = fixture(t);
    repo.git('config', 'diff.relative', 'true');
    repo.write(
        'packages/library/package.json',
        JSON.stringify({ name: '@example/nested', version: '1.0.0' })
    );
    repo.write(
        'packages/library/.changeset/config.json',
        readFileSync(join(repo.root, '.changeset/config.json'))
    );
    repo.write(
        'packages/library/.changeset/new.md',
        '---\n"@example/nested": patch\n---\nFix a nested package.\n'
    );
    repo.commit();
    const result = repo.check(['--cwd', join(repo.root, 'packages/library')]);
    assert.equal(result.status, 0, result.stderr);
});

test('installs manually configured hooks without rewriting YAML and enforces the policy during git push', (t) => {
    const repo = fixture(t);
    // This test must exercise hooks even when the caller disables them for CI Git operations.
    const hookEnv = { ...process.env, LEFTHOOK: '1' };
    const source = fileURLToPath(new URL('../', import.meta.url));
    repo.write(
        'package.json',
        JSON.stringify({ name: '@koslibs/configs', version: '0.2.11', type: 'module' })
    );
    repo.write('.gitignore', 'node_modules/\nremote.git/\n');
    const originalConfig =
        '# Keep comments and formatting exactly as written.\nextends:\n  - ./lefthook/index.yml\n  - ./lefthook/repository.yml\nlefthook: node "cli/release.js" hooks:run\npre-commit:\n  commands:\n    local-check:\n      run: echo local-check\n';
    repo.write('lefthook.yaml', originalConfig);
    for (const directory of ['cli', 'release', 'lefthook']) {
        cpSync(join(source, directory), join(repo.root, directory), { recursive: true });
    }
    symlinkSync(join(source, 'node_modules'), join(repo.root, 'node_modules'), 'junction');
    repo.commit();
    repo.git('init', '--bare', 'remote.git');
    repo.git('remote', 'add', 'origin', join(repo.root, 'remote.git'));
    repo.git('config', 'core.hooksPath', '.git/hooks');
    const install = () =>
        spawnSync(process.execPath, [checker, 'hooks:install'], {
            cwd: repo.root,
            encoding: 'utf8',
            env: hookEnv,
        });
    assert.equal(install().status, 0);
    assert.equal(install().status, 0);
    const config = readFileSync(join(repo.root, 'lefthook.yaml'), 'utf8');
    assert.equal(config, originalConfig);
    assert.equal(existsSync(join(repo.root, 'lefthook.yml')), false);
    assert.match(
        readFileSync(join(repo.root, '.git/hooks/pre-push'), 'utf8'),
        /node.*cli\/release\.js.*hooks:run/
    );
    const push = () =>
        spawnSync(
            'git',
            ['-c', `safe.directory=${repo.root}`, 'push', 'origin', 'HEAD:refs/heads/feature'],
            {
                cwd: repo.root,
                encoding: 'utf8',
                env: hookEnv,
            }
        );
    const rejected = push();
    assert.notEqual(rejected.status, 0, rejected.stdout + rejected.stderr);
    assert.match(rejected.stdout + rejected.stderr, /no new committed changeset/);
    repo.git('config', 'core.hooksPath', '.disabled-hooks');
    repo.write('.changeset/new.md', '---\n"@koslibs/configs": patch\n---\nShip release tooling.\n');
    repo.commit();
    repo.git('config', 'core.hooksPath', '.git/hooks');
    const accepted = push();
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
});

test('creates a ready-to-use consumer template only on the first installation', (t) => {
    const repo = fixture(t);
    const source = fileURLToPath(new URL('../', import.meta.url));
    mkdirSync(join(repo.root, 'node_modules/@koslibs'), { recursive: true });
    symlinkSync(source, join(repo.root, 'node_modules/@koslibs/configs'), 'junction');
    repo.git('config', 'core.hooksPath', '.git/hooks');
    const install = () =>
        spawnSync(process.execPath, [checker, 'hooks:install'], {
            cwd: repo.root,
            encoding: 'utf8',
        });
    const first = install();
    assert.equal(first.status, 0, first.stdout + first.stderr);
    const template = readFileSync(join(repo.root, 'lefthook.yml'), 'utf8');
    assert.equal(
        template,
        'extends:\n    - ./node_modules/@koslibs/configs/lefthook/index.yml\nlefthook: node "node_modules/@koslibs/configs/cli/release.js" hooks:run\n'
    );
    assert.match(
        readFileSync(join(repo.root, '.git/hooks/pre-push'), 'utf8'),
        /node_modules\/@koslibs\/configs\/cli\/release\.js/
    );
    repo.write('lefthook.yml', `# Local comment\n${template}`);
    const second = install();
    assert.equal(second.status, 0, second.stdout + second.stderr);
    assert.equal(
        readFileSync(join(repo.root, 'lefthook.yml'), 'utf8'),
        `# Local comment\n${template}`
    );
});

test('preserves existing JSON and configs in .config without creating a competing YAML file', (t) => {
    for (const file of ['lefthook.json', '.lefthook.json', '.config/lefthook.yml']) {
        const repo = fixture(t);
        const contents = file.endsWith('.json')
            ? '{\n  "pre-commit": { "commands": { "local": { "run": "echo local" } } }\n}\n'
            : '# Keep this config\npre-commit:\n  commands:\n    local:\n      run: echo local\n';
        repo.write(file, contents);
        repo.git('config', 'core.hooksPath', '.git/hooks');
        const result = spawnSync(process.execPath, [checker, 'hooks:install'], {
            cwd: repo.root,
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(readFileSync(join(repo.root, file), 'utf8'), contents);
        assert.equal(existsSync(join(repo.root, 'lefthook.yml')), false);
    }
});
