import mergeConfig from '../shared/merge-config.mjs';

export const rstestConfig = {
    testEnvironment: 'node',
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    passWithNoTests: false,
    coverage: {
        reporters: ['text', 'html', 'lcov'],
    },
};

export const createRstestConfig = (overrides = {}) => mergeConfig(rstestConfig, overrides);

export default rstestConfig;
