# Rstest presets

## Libraries (Node environment)

Install `@koslibs/configs` as a development dependency, then create `rstest.config.mjs`.
The package installs pinned versions of Rstest and its preset dependencies:

```js
import { createRstestConfig } from '@koslibs/configs/rstest';

export default createRstestConfig({
    include: ['src/**/*.test.ts'],
});
```

## React applications and component libraries

The React plugin and `happy-dom` are included in `@koslibs/configs` dependencies.
React and React DOM belong to the consuming project.

```js
import { createReactRstestConfig } from '@koslibs/configs/rstest/react';

export default createReactRstestConfig({
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./rstest.setup.ts'],
});
```

The React preset enables JSX through the React plugin and uses a simulated DOM.
It does not run browser, screenshot or Playwright tests. Keep their file patterns
separate from unit tests using `include` / `exclude` in the consuming project.

For Testing Library, install `@testing-library/react` and
`@testing-library/jest-dom` and create the optional setup file:

```ts
import { afterEach, expect } from '@rstest/core';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
afterEach(() => cleanup());
```

## Defaults and overrides

Both presets use explicit test imports (`globals: false`), clear mock histories,
restore spies between tests and fail when no tests are found. Coverage is opt-in
with `rstest run --coverage`; reports use text, HTML and LCOV. No coverage threshold
or automatic retry is imposed. Use `rstest run` in CI and `rstest` locally.

Factories follow the shared configuration merge convention: nested objects merge,
arrays append, and scalar values override. Additional React plugins append after
the built-in React plugin. Paths are relative to the consuming project. Configure
aliases, setup files, test patterns and coverage thresholds locally.

Rstest, the React plugin and `happy-dom` are installed for every consumer, with
exact versions managed by `@koslibs/configs`. Import the React preset through
`/rstest/react` explicitly. Package managers with strict dependency isolation may
still require a direct `@rstest/core` dependency when tests import from it or
project scripts invoke its CLI; use the same version declared by this package.

Types are verified with TypeScript's `moduleResolution: "Bundler"`. With the tested
Rstest 0.12.2 dependency tree, `NodeNext` and `skipLibCheck: false` report TS1479 in
Rsbuild's bundled plugin declarations. For configuration files using NodeNext,
`skipLibCheck: true` avoids checking those third-party declarations.
