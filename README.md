# @koslibs/configs

Shared lint, format, test presets and release tooling for npm packages.

## Release setup

Install `@koslibs/configs` as a dev dependency and add these scripts to the consuming package:

```json
{
    "scripts": {
        "changeset": "koslibs-release add",
        "changeset:check": "koslibs-release check",
        "version-package": "koslibs-release version",
        "release": "koslibs-release publish",
        "prepare": "koslibs-release hooks:install"
    }
}
```

Changesets, the GitHub changelog formatter, Lefthook and Commitlint CLI are included in configs dependencies. Consumers do not need to install them separately. Keep existing build and test commands on `koslibs-builder` and lint/format commands on `koslibs-lint`.

Run `npx --no-install koslibs-release init` once if `.changeset/config.json` does not exist. Configure the formatter and the actual repository:

```json
{
    "changelog": ["@koslibs/configs/changelog", { "repo": "koslibs/your-package" }],
    "baseBranch": "main",
    "access": "public",
    "commit": false
}
```

Merge these fields into the generated config. Keep the other Changesets settings. For snapshots, use `"snapshot": { "prereleaseTemplate": "{tag}-{commit}", "useCalculatedVersion": true }`.

Run `npm run prepare` to install Git hooks. When no main Lefthook config exists, it creates a ready-to-use `lefthook.yml` with the shared preset and a bootstrap that resolves Lefthook through configs rather than a global executable. Existing configs are used as-is, preserving their comments and formatting. Installation is skipped outside the Git checkout root, including dependency installation. If `prepare` already performs other setup, append `koslibs-release hooks:install` to it.

If the project already has a Lefthook config, add the following fields manually before running `npm run prepare`. Merge the preset into the existing `extends` list and keep one main config file:

```yaml
extends:
    - ./node_modules/@koslibs/configs/lefthook/index.yml
lefthook: node "node_modules/@koslibs/configs/cli/release.js" hooks:run
```

The installer recognizes main YAML, TOML, JSON and JSONC configs, including dotted filenames and configs in `.config`. Shared hook setup in an existing config is your responsibility; the installer does not parse or rewrite it.

For an existing Lefthook config, remove old duplicate pre-push commands when migrating. Lefthook applies `extends` after the root config. Put shared-command overrides in a later `extends` file or `lefthook-local.yml`; other local commands are preserved. Configure Prettier, ESLint and Commitlint with their existing configs presets; the hook preset also runs lint/format before commit and checks commit messages.

## Before pushing

```sh
npm run changeset
# Select the package and patch/minor/major, then describe the change.
git add .changeset/*.md
git commit -m "feat: describe the change"
git push
```

The pre-push hook reads Git's stdin and checks each pushed branch SHA against its merge base with `<remote>/<baseBranch>`. Fetch that base branch first. A changeset must be newly added and committed, contain a description, and request patch/minor/major for this package. An old changeset already on the base branch, an empty changeset or an uncommitted file does not pass. Branch deletions, tags and commits already on the base branch are allowed. One changeset can cover several pushes on the same feature branch before merge; documentation and tooling changes also require one.

The initial policy supports one package per Changesets config, including a package in a subdirectory. A workspace-wide monorepo needs a separate policy for mapping changed packages to releases.

For manual or CI checks:

```sh
npm run changeset:check -- --base origin/main --head HEAD
```

## Shared GitHub workflows

After publishing this change, pin the workflows to the resulting release tag or commit SHA. The examples use the anticipated patch tag `v0.2.12`; use the actual published tag if other pending changes affect the version. GitHub loads reusable workflows from the configs Git repository, not from npm.

`.github/workflows/pull-request.yml`:

```yaml
name: Pull request
on: pull_request
permissions:
    contents: read
jobs:
    changeset:
        uses: koslibs/configs/.github/workflows/changeset-check.yml@v0.2.12
```

The check validates the PR's exact base/head SHAs. After its first run, make the resulting `Changeset required` check mandatory in branch protection or a ruleset. Local hooks can be bypassed; the required GitHub check enforces the merge policy. Use `pull_request`, so the check receives no publication secrets.

`.github/workflows/release.yml`:

```yaml
name: Release
on:
    push:
        branches: [main]
    workflow_dispatch:
permissions:
    contents: write
    id-token: write
jobs:
    release:
        if: github.actor != 'github-actions[bot]' || github.event_name == 'workflow_dispatch'
        uses: koslibs/configs/.github/workflows/npm-release.yml@v0.2.12
        secrets: inherit
```

The release workflow checks out the latest base branch, installs the lockfile, runs any lint/typecheck/test scripts, consumes changesets with `version-package`, updates the lockfile, commits the new version and `CHANGELOG.md`, publishes with `release`, and pushes Changesets' Git tags. Releases for a base branch are serialized. A manual rerun can retry publication if the release commit succeeded but npm publication failed. The commit includes `[skip ci]`; release-bot Git operations bypass local hooks.

The default is npm Trusted Publishing on GitHub-hosted runners. Configure the consumer repository and the calling filename `release.yml` in npm; the calling workflow is what npm validates for reusable workflows. Both workflows grant `id-token: write`. Node defaults to 24.13.0 (npm 11.5.1 or newer is required). See [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

Alternatively supply the optional `npm_token` secret (map your existing `NPM_TOKEN`). For a protected base branch, the release writer must be allowed to push release commits. If necessary, pass `release_token` from a GitHub App allowed to bypass that rule. Repository protections, npm Trusted Publisher registration and credentials remain per repository.

```yaml
secrets:
    npm_token: ${{ secrets.NPM_TOKEN }}
    release_token: ${{ secrets.RELEASE_TOKEN }}
```

Reusable workflows accept `node-version` and `package-directory`; the release workflow also accepts `base-branch` (default `main`). Match it to Changesets' `baseBranch` and the caller's push trigger.

A manual snapshot caller can use `koslibs/configs/.github/workflows/npm-snapshot.yml@v0.2.12`, `contents: read`, `id-token: write`, and the same secret mapping. It versions and publishes the checked-out ref under the `snapshot` dist-tag without committing release files or creating Git tags. It accepts a `tag` input. Register the snapshot caller filename with npm if using OIDC, or pass a publication token.

## Commands

`koslibs-release add`, `init`, `status`, `version` and `publish` forward arguments to the bundled Changesets CLI. `check` accepts `--base`, `--head`, `--remote`, `--cwd` and `--pre-push`. `hooks:install` installs the shared Git hooks; `hooks:run` is their Lefthook bootstrap.

No command publishes during installation. Run `npm run changeset` yourself to write the release description; the push hook checks it rather than opening an interactive prompt during Git operations.
