import mergeConfig from '../shared/merge-config.mjs';

export const viteConfig = {
    server: {
        host: true,
        port: 5173,
        strictPort: true,
    },
    preview: {
        host: true,
        port: 4173,
        strictPort: true,
    },
};

export const createViteConfig = (overrides = {}) => mergeConfig(viteConfig, overrides);

export default viteConfig;
