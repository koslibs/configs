import mergeConfig from '../shared/merge-config.mjs';

const defaultReporter = process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]];

export const playwrightConfig = {
    testDir: './playwright',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: defaultReporter,
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
};

export const createPlaywrightConfig = (overrides = {}) => mergeConfig(playwrightConfig, overrides);

export default playwrightConfig;
