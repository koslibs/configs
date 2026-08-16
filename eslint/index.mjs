import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-helpers';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { globalIgnores } from './config.mjs';

const ignores = ['**/node_modules', '**/wailsjs', '**/dist', '**/.cache', '**/*.json'];
const files = ['**/*.{ts,tsx,js,jsx,mjs,cjs}'];
const prettierFiles = ['**/*.{ts,tsx,js,jsx,mjs,cjs,json}'];

export const baseEslintConfig = [
    globalIgnores(ignores),
    {
        ...js.configs.recommended,
        files,
    },
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: config.files ?? files,
    })),
    {
        files,
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                Controller: 'readonly',
            },
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                sourceType: 'module',
            },
        },
        plugins: {
            'import-helpers': importPlugin,
        },
        rules: {
            'import-helpers/order-imports': [
                'error',
                {
                    newlinesBetween: 'always',
                    groups: ['/^node:/', 'module', 'parent', 'sibling', 'index', '/.css$/'],
                    alphabetize: { order: 'asc', ignoreCase: true },
                },
            ],
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                'assert',
                                'buffer',
                                'child_process',
                                'cluster',
                                'crypto',
                                'dgram',
                                'dns',
                                'domain',
                                'events',
                                'freelist',
                                'fs',
                                'http',
                                'https',
                                'module',
                                'net',
                                'os',
                                'path',
                                'punycode',
                                'querystring',
                                'readline',
                                'repl',
                                'smalloc',
                                'stream',
                                'string_decoder',
                                'sys',
                                'timers',
                                'tls',
                                'tracing',
                                'tty',
                                'url',
                                'util',
                                'vm',
                                'zlib',
                            ],
                            message: 'Use prefix node: for node packages',
                        },
                    ],
                    paths: [
                        {
                            name: 'node:assert',
                            message: 'Use node:assert/strict instead',
                        },
                    ],
                },
            ],
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-use-before-define': 'error',
            '@typescript-eslint/no-empty-interface': 'error',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-shadow': ['error'],
            '@typescript-eslint/ban-ts-ignore': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-empty-function': [
                'error',
                {
                    allow: ['arrowFunctions'],
                },
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^error',
                },
            ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    fixStyle: 'inline-type-imports',
                },
            ],
            'no-cond-assign': 'error',
            'no-control-regex': 'error',
            'no-debugger': 'error',
            'no-dupe-keys': 'error',
            'no-dupe-args': 'error',
            'no-empty': 'error',
            'no-empty-character-class': 'error',
            'no-extra-semi': 'error',
            'no-ex-assign': 'error',
            'no-func-assign': 'error',
            'no-inner-declarations': 'error',
            'no-invalid-regexp': 'error',
            'no-obj-calls': 'error',
            'no-regex-spaces': 'error',
            'no-unreachable': 'error',
            'no-unreachable-loop': 'error',
            'no-var': 'error',
            'no-multiple-empty-lines': [
                'error',
                {
                    max: 1,
                    maxEOF: 1,
                },
            ],
            'no-unsafe-negation': 'error',
            'no-console': [
                'error',
                {
                    allow: ['info', 'error'],
                },
            ],
            'no-use-before-define': 'off',
            'no-shadow': 'off',
            'no-const-assign': 'error',
            'no-constant-condition': 'off',
            'no-plusplus': 'error',
            'no-caller': 'error',
            'no-alert': 'error',
            'no-div-regex': 'error',
            'no-else-return': 'error',
            'no-eval': 'error',
            'no-extend-native': 'error',
            'no-fallthrough': 'error',
            'no-floating-decimal': 'error',
            'no-implied-eval': 'error',
            'no-labels': 'error',
            'no-iterator': 'error',
            'no-lone-blocks': 'error',
            'no-loop-func': 'error',
            'no-multi-str': 'error',
            'no-global-assign': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-proto': 'error',
            'no-return-assign': 'error',
            'no-sequences': 'error',
            'no-with': 'error',
            'no-undef': 'error',
            'no-undef-init': 'error',
            'no-unused-expressions': 'error',
            'no-warning-comments': 'off',
            'no-nested-ternary': 'error',
            'no-trailing-spaces': 'error',
            'no-ternary': 'off',
            'no-array-constructor': 'off',
            'no-underscore-dangle': 'off',
            'no-mixed-spaces-and-tabs': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            'semi-spacing': 'error',
            'dot-notation': 'error',
            radix: 'error',
            yoda: 'error',
            'wrap-iife': 'error',
            eqeqeq: 'error',
            'eol-last': 'error',
            complexity: 'off',
            curly: 'error',
            quotes: ['error', 'single'],
            'object-curly-spacing': [1, 'always'],
            'default-case': 'error',
            'comma-dangle': [
                'error',
                {
                    arrays: 'always-multiline',
                    exports: 'always-multiline',
                    functions: 'never',
                    imports: 'always-multiline',
                    objects: 'always-multiline',
                },
            ],
            'max-params': [2, 6],
            'max-nested-callbacks': ['error', 3],
            'brace-style': 'error',
            camelcase: [
                'error',
                {
                    properties: 'never',
                },
            ],
            'new-parens': 'error',
            'max-len': [
                'error',
                {
                    code: 100,
                    tabWidth: 2,
                    ignoreComments: true,
                    ignoreUrls: true,
                    ignoreTemplateLiterals: true,
                    ignoreStrings: true,
                    ignoreRegExpLiterals: true,
                },
            ],
        },
    },
    {
        files: prettierFiles,
        plugins: {
            prettier,
        },
        rules: {
            'prettier/prettier': [
                'error',
                {
                    trailingComma: 'es5',
                    tabWidth: 4,
                    useTabs: false,
                    printWidth: 100,
                    semi: true,
                    endOfLine: 'auto',
                    singleQuote: true,
                },
            ],
        },
    },
    eslintConfigPrettier,
];

export default baseEslintConfig;
