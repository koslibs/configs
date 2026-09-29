import { pluginReact } from '@rsbuild/plugin-react';

import { createRstestConfig } from './index.mjs';

export const createReactRstestConfig = (overrides = {}) =>
    createRstestConfig({
        testEnvironment: 'happy-dom',
        ...overrides,
        plugins: [pluginReact(), ...(overrides.plugins ?? [])],
    });

export const reactRstestConfig = createReactRstestConfig();

export default reactRstestConfig;
