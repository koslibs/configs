# @koslibs/configs

## 1.0.1

### Patch Changes

- [`2cb7a66`](https://github.com/koslibs/configs/commit/2cb7a66a561ac91a468ce250ee7d3703d000d3b7) Thanks [@holypower777](https://github.com/holypower777)! - Fix the release test fixture for Changesets 3 on Windows by loading the changelog module through a file URL.

## 1.0.0

### Major Changes

- [`2dbe778`](https://github.com/koslibs/configs/commit/2dbe7785a165ba042b8ffd3f3b79e18e3bfd78f8) Thanks [@holypower777](https://github.com/holypower777)! - Исправлены уязвимости

## 0.2.12

### Patch Changes

- [`0859e98`](https://github.com/koslibs/configs/commit/0859e98e941a71702fc018fa05a84ee33ed81a42) Thanks [@holypower777](https://github.com/holypower777)! - Limit the Lefthook bypass to release-bot Git operations and explicitly enable hooks in the Git push integration test so inherited CI settings cannot disable its checks.

- [#10](https://github.com/koslibs/configs/pull/10) [`da943aa`](https://github.com/koslibs/configs/commit/da943aac8a7b41e711b5581304e43c18e7c83b66) Thanks [@holypower777](https://github.com/holypower777)! - Add `koslibs-lint lint` and `koslibs-lint lint:fix` to run ESLint and Prettier in sequence. Stop on failures and propagate the tool's exit code.

    Require Node.js 24.13.0 or newer and use Node.js 24.13.0 for development and releases.

- [#11](https://github.com/koslibs/configs/pull/11) [`d45cb68`](https://github.com/koslibs/configs/commit/d45cb68f8f87817bb62d8e36d8852a076e1fc166) Thanks [@holypower777](https://github.com/holypower777)! - Add the shared koslibs-release CLI for changesets, versioning, publication and portable Git hooks. Provide reusable release, snapshot and PR-check workflows so consumers can keep only project-specific settings.

    Create a shared Lefthook template only when no main config exists. Preserve existing configs for manual preset setup and remove the direct js-yaml dependency.

## 0.1.0

### Minor Changes

- [#1](https://github.com/koslibs/configs/pull/1) [`1ce0a76`](https://github.com/koslibs/configs/commit/1ce0a76fd13f22a215649f1448b36cb29bba2b85) Thanks [@holypower777](https://github.com/holypower777)! - init configs
